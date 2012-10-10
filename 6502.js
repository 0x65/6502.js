var cpu = (function () {
    var A, X, Y, SP, PC, FLAGS, memory;
    var break_flag, cycles;

    function reset_cpu() {
        A = X = Y = PC = cycles = 0;
        SP = 0xFF;
        FLAGS = 0x20;
        memory = [];
        break_flag = false;
    }

    function get_memory(address) { return memory[address]; }
    function is_running() { return !break_flag; }

    function load(bytecode, load_to) {
        reset_cpu();
        if (typeof load_to == "undefined") load_to = 0x600;

        for(var i=0, len=bytecode.length; i<len; i++)
            memory[load_to+i] = bytecode[i];

        PC = load_to; // set pc = byte at $FFFD * 256 + byte at $FFFC
    }

    function execute() {
        var op_code = memory[PC++]&0xFF;
        var address_value = address_mode[op_code](check_page_boundaries[op_code]);
        var cycle_time = cycle_times[op_code];

        instructions[op_code](address_value[0], address_value[1]);
        cycles += cycle_time;
        return cycle_time;
    }

    /* STACK OPERATIONS */
    function PUSH(val) {
        SP--;
        SP &= 0xFF;
        memory[SP+0x100] = val&0xFF;
    }

    function POP() {
        val = memory[SP+0x100];
        SP++;
        SP &= 0xFF;
        return val;
    }

    /* ADDRESSING MODES */
    function IMPLIED() { return [null, null]; }
    function IMMEDIATE() { return [null, memory[PC++] || 0]; }

    function ZEROPAGE() {
        var address = memory[PC++] || 0;
        return [address, memory[address] || 0];
    }

    function ZEROPAGEX() {
        var address = ((memory[PC++] || 0)+X)&0xFF;
        return [address, memory[address] || 0];
    }

    function ZEROPAGEY() {
        var address = ((memory[PC++] || 0)+Y)&0xFF;
        return [address, memory[address] || 0];
    }

    function INDIRECT() {
        var indirect_address = (memory[PC] || 0) + ((memory[(PC+1)&0xFFFF] || 0)<<8);
        var address = (memory[indirect_address] || 0) + ((memory[(indirect_address+1)&0xFFFF] || 0)<<8);
        PC += 2;
        return [address, memory[address] || 0];
    }

    function INDIRECTX() {
        var indirect_address = ((memory[PC++] || 0) + X)&0xFF;
        var address = (memory[indirect_address] || 0) + ((memory[(indirect_address+1)&0xFFFF] || 0)<<8);
        return [address, memory[address] || 0];
    }

    function INDIRECTY() {
        var indirect_address = memory[PC++] || 0;
        var address = (((memory[indirect_address] || 0) + ((memory[(indirect_address+1)&0xFFFF] || 0)<<8))+Y)&0xFFFF;
        return [address, memory[address] || 0];
    }

    function RELATIVE() {
        var indirect_address = memory[PC++] || 0;
        var address = ((indirect_address&128) ? PC-((indirect_address^0xFF)+1) : PC+indirect_address)&0xFFFF;
        return [address, memory[address] || 0];
    }

    function ABSOLUTE() {
        var address = (memory[PC] || 0) + ((memory[(PC+1)&0xFFFF] || 0)<<8);
        PC += 2;
        return [address, memory[address] || 0];
    }

    function ABSOLUTEY(check_page_boundary) {
        var low = ABSOLUTE()[0];
        var high = (low+Y)&0xFFFF;
        if (check_page_boundary && ((low&0xFF00)!=(high&0xFF00))) cycles++;
        return [high, memory[high] || 0];
    }

    function ABSOLUTEX(check_page_boundary) {
        var low = ABSOLUTE()[0];
        var high = (low+X)&0xFFFF;
        if (check_page_boundary && ((low&0xFF00)!=(high&0xFF00))) cycles++;
        return [high, memory[high] || 0];
    }

    /* HELPER FUNCTIONS */
    function _branch_if(condition, address) {
        if (condition) {
            cycles += ((PC&0xFF00) != (address&0xFF00) ? 2 : 1);
            PC = address;
        }
    }

    /* INSTRUCTIONS */
    function AAX(address) { memory[address] = A&X; }

    function ADC(address, value) {
        var t = value + A + (FLAGS&0x1);
        if ((~(A^value)&(A^t))&0x80) FLAGS |= 0x40; else FLAGS &= 0xBF;
        if (FLAGS&0x8) {
            if (((A&0xF) + (value&0xF) + (FLAGS&0x1)) > 0x9) t += 0x6;
            if (t > 0x99) {
                t += 0x60;
                FLAGS |= 0x1;
            } else FLAGS &= 0xFE;
        } else {
            if (t > 0xFF) FLAGS |= 0x1; else FLAGS &= 0xFE;
        }
        A = t&0xFF;
        if (A) FLAGS &= 0xFD; else FLAGS |= 0x2;
        if (A&0x80) FLAGS |= 0x80; else FLAGS &= 0x7F;
    }

    function ANC(address, value) {
        AND(address, value);
        if (A&0x80) FLAGS |= 0x1;
    }

    function AND(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A &= value) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function ARR(address, value) {
        AND(address, value);
        ROR_A();
    }

    function ASL(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value&0x80) FLAGS |= 0x1;
        if (value=(value<<1)&0xFF) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
    }

    function ASR(address, value) {
        AND(address, value);
        LSR_A();
    }

    function ASL_A() {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (A&0x80) FLAGS |= 0x1;
        if (A=(A<<1)&0xFF) FLAGS |= (A&0x80); else FLAGS |= 0x2;
        A &= 0xFF;
    }

    // there seems to be some confusion about what this instruction (op-code: $AB) actually does
    function ATX(address, value) {
        AND(address, value);
        X = A;
    }

    function AXA(address) { memory[address] = A & X & ((address>>2)+1); }

    function AXS(address, value) {
        var t = A&X;
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value == t) FLAGS |= 0x3;
        else if (value > t) FLAGS |= 0x80;
        else FLAGS |= 0x1;
        X = (t - value)&0xFF;
    }

    function BEQ(address) { _branch_if(FLAGS&0x2, address); }

    function BIT(address, value) {
        FLAGS &= 0x3D; // unset bits 2, 64, 128
        if ((value&A) == 0) FLAGS |= 0x2;
        FLAGS |= value&0xC0;
    }

    function BMI(address) { _branch_if(FLAGS&0x80, address); }

    function BPL(address) { _branch_if((FLAGS&0x80)==0, address); }

    function BCC(address) { _branch_if((FLAGS&0x1)==0, address); }

    function BCS(address) { _branch_if(FLAGS&0x1, address); }

    function BNE(address) { _branch_if((FLAGS&0x2)==0, address); }

    function BRK() {
        PUSH((PC>>8)&0xFF);
        PUSH(PC&0xFF);
        FLAGS |= 0x10;
        PUSH(FLAGS);
        FLAGS |= 0x4;
        PC = (memory[0xFFFE] || 0) + ((memory[0xFFFF] || 0)<<8);
        break_flag = true;
    }

    function BVC(address) { _branch_if((FLAGS&0x40)==0, address); }

    function BVS(address) { _branch_if(FLAGS&0x40, address); }

    function CLC() { FLAGS &= 0xFE; }

    function CLD() { FLAGS &= 0xF7; }

    function CLI() { FLAGS &= 0xFB; }

    function CLV() { FLAGS &= 0xBF; }

    function CMP(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value == A) FLAGS |= 0x3;
        else if (value > A) FLAGS |= 0x80;
        else FLAGS |= 0x1;
    }

    function CPX(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value == X) FLAGS |= 0x3;
        else if (value > X) FLAGS |= 0x80;
        else FLAGS |= 0x1;
    }

    function CPY(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value == Y) FLAGS |= 0x3;
        else if (value > Y) FLAGS |= 0x80;
        else FLAGS |= 0x1;
    }

    function DCP(address, value) {
        DEC(address, value);
        CMP(address, memory[address]);
    }

    function DEC(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (value = (value-1)&0xFF) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
    }

    function DEX() {
        X--;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (X &= 0xFF) FLAGS |= (X&0x80); else FLAGS |= 0x2;
    }

    function DEY() {
        Y--;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (Y &= 0xFF) FLAGS |= (Y&0x80); else FLAGS |= 0x2;
    }

    function DOP() { PC++; }

    function EOR(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A ^= value) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function INC(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (value = (value+1)&0xFF) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
    }

    function INX() {
        X++;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (X &= 0xFF) FLAGS |= (X&0x80); else FLAGS |= 0x2;
    }

    function INY() {
        Y++;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (Y &= 0xFF) FLAGS |= (Y&0x80); else FLAGS |= 0x2;
    }

    function ISC(address, value) {
        INC(address, value);
        SBC(address, memory[address]);
    }

    function JAM() { break_flag = true; }

    function JMP(address) { PC = address; }

    function JSR(address) {
        PUSH((PC>>8)&0xFF);
        PUSH(PC&0xFF);
        PC = address;
    }

    function LDA(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = value) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function LAR(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = X = SP = (SP & value)) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function LAX(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = X = value) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function LDX(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (X = value) FLAGS |= (X&0x80); else FLAGS |= 0x2;
    }

    function LDY(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (Y = value) FLAGS |= (Y&0x80); else FLAGS |= 0x2;
    }

    function LSR(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        FLAGS |= value&0x1;
        if ((value=value>>1) == 0) FLAGS |= 0x2;
        memory[address] = value;
    }

    function LSR_A() {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        FLAGS |= A&0x1;
        if ((A=A>>1) == 0) FLAGS |= 0x2;
    }

    function NOP() { }

    function ORA(address, value) {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A |= value) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function PHA() { PUSH(A); }

    function PHP() { PUSH(FLAGS|0x10); }

    function PLA() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = POP()) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function PLP() { FLAGS = POP(); }

    function RLA(address, value) {
        ROL(address, value);
        AND(address, memory[address]);
    }

    function ROL(address, value) {
        value <<= 1;
        if (FLAGS&0x1) value |= 0x1;
        if (value <= 0xFF) FLAGS &= 0xFE; else FLAGS |= 0x1;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (value &= 0xFF) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
    }

    function ROL_A() {
        A <<= 1;
        if (FLAGS&0x1) A |= 0x1;
        if (A <= 0xFF) FLAGS &= 0xFE; else FLAGS |= 0x1;
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A &= 0xFF) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function ROR(address, value) {
        if (FLAGS&0x1) value |= 0x100;
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        FLAGS |= (value&0x1);
        if (value >>= 1) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
    }

    function ROR_A() {
        if (FLAGS&0x1) A |= 0x100;
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        FLAGS |= (A&0x1);
        if (A >>= 1) FLAGS |= (A&0x80); else FLAGS |= 0x2;
    }

    function RRA(address, value) {
        ROR(address, value);
        ADC(address, memory[address]);
    }

    function RTI() {
        FLAGS = POP();
        PC = POP();
        PC |= POP() << 8;
    }

    function RTS() {
        PC = POP();
        PC += (POP()<<8);
    }

    function SBC(address, value) {
        value = value ^ 0xFF;
        var t = A + value + (FLAGS&0x1);
        if ((A^value)&(A^t)&0x80) FLAGS |= 0x40; else FLAGS &= 0xBF;
        t = A + value + (FLAGS&0x1);
        if (t>0xFF) FLAGS |= 0x1; else FLAGS &= 0xFE;
        A = t&0xFF;
        if (FLAGS&0x8) {
            A -= 0x66;
            if ((A&0xF) > 0x9) A += 0x6;
            if (A > 0x99) { 
                A += 0x60; 
                FLAGS |= 0x1;
            } else FLAGS &= 0xFE;
        }
        if (A) FLAGS &= 0xFD; else FLAGS |= 0x2;
        if (A&0x80) FLAGS |= 0x80; else FLAGS &=0x7F;
    }

    function SEC() { FLAGS |= 0x1; }

    function SED() { FLAGS |= 0x8; }

    function SEI() { FLAGS |= 0x4; }

    function SLO(address, value) {
        FLAGS &= 0x7C; // unset bits 1, 2, 128
        if (value&0x80) FLAGS |= 0x1;
        if (value<<=1) FLAGS |= (value&0x80); else FLAGS |= 0x2;
        memory[address] = value;
        A |= value;
    }

    function SRE(address, value) {
        LSR(address, value);
        EOR(address, memory[address]);
    }

    function STA(address) { memory[address] = A; }

    function STX(address) { memory[address] = X; }

    function STY(address) { memory[address] = Y; }

    function SXA(address) { memory[address] = Y & ((address>>2)+1); }

    function SYA(address) { memory[address] = Y & ((address>>2)+1); }

    function TAX() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (X = A) FLAGS |= 0x2; else FLAGS |= (X&0x80);
    }

    function TAY() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (Y = A) FLAGS |= 0x2; else FLAGS |= (Y&0x80);
    }

    function TOP() { PC += 2; }

    function TSX() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (X = SP) FLAGS |= 0x2; else FLAGS |= (X&0x80);
    }

    function TXA() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = X) FLAGS |= 0x2; else FLAGS |= (A&0x80);
    }

    function TXS() { SP = X; }

    function TYA() {
        FLAGS &= 0x7D; // unset bits 2, 128
        if (A = Y) FLAGS |= 0x2; else FLAGS |= (A&0x80);
    }

    function XAA(address, value) {
        TXA();
        AND(address, value);
    }

    function XAS(address) {
        SP = X&A;
        memory[address] = SP & ((address>>2)+1);
    }

    /* INSTRUCTION CONSTANTS */
    var instructions = [
        BRK, ORA, JAM, SLO, DOP, ORA, ASL, SLO, PHP, ORA, ASL_A, ANC, TOP, ORA, ASL, SLO,   // 0x00 - 0x0F
        BPL, ORA, JAM, SLO, DOP, ORA, ASL, SLO, CLC, ORA, NOP, SLO, NOP, ORA, ASL, SLO,     // 0x10 - 0x1F
        JSR, AND, JAM, RLA, BIT, AND, ROL, RLA, PLP, AND, ROL_A, ANC, BIT, AND, ROL, RLA,   // 0x20 - 0x2F
        BMI, AND, JAM, RLA, DOP, AND, ROL, RLA, SEC, AND, NOP, RLA, NOP, AND, ROL, RLA,     // 0x30 - 0x3F
        RTI, EOR, JAM, SRE, DOP, EOR, LSR, SRE, PHA, EOR, LSR_A, ASR, JMP, EOR, LSR, SRE,   // 0x40 - 0x4F
        BVC, EOR, JAM, SRE, DOP, EOR, LSR, SRE, CLI, EOR, NOP, SRE, NOP, EOR, LSR, SRE,     // 0x50 - 0x5F
        RTS, ADC, JAM, RRA, DOP, ADC, ROR, RRA, PLA, ADC, ROR_A, ARR, JMP, ADC, ROR, RRA,   // 0x60 - 0x6F
        BVS, ADC, JAM, RRA, DOP, ADC, ROR, RRA, SEI, ADC, NOP, RRA, NOP, ADC, ROR, RRA,     // 0x70 - 0x7F
        DOP, STA, DOP, AAX, STY, STA, STX, AAX, DEY, DOP, TXA, XAA, STY, STA, STX, AAX,     // 0x80 - 0x8F
        BCC, STA, JAM, AXA, STY, STA, STX, AAX, TYA, STA, TXS, XAS, SYA, STA, SXA, AXA,     // 0x90 - 0x9F
        LDY, LDA, LDX, LAX, LDY, LDA, LDX, LAX, TAY, LDA, TAX, ATX, LDY, LDA, LDX, LAX,     // 0xA0 - 0xAF
        BCS, LDA, JAM, LAX, LDY, LDA, LDX, LAX, CLV, LDA, TSX, LAR, LDY, LDA, LDX, LAX,     // 0xB0 - 0xBF
        CPY, CMP, DOP, DCP, CPY, CMP, DEC, DCP, INY, CMP, DEX, AXS, CPY, CMP, DEC, DCP,     // 0xC0 - 0xCF
        BNE, CMP, JAM, DCP, DOP, CMP, DEC, DCP, CLD, CMP, NOP, DCP, NOP, CMP, DEC, DCP,     // 0xD0 - 0xDF
        CPX, SBC, DOP, ISC, CPX, SBC, INC, ISC, INX, SBC, NOP, SBC, CPX, SBC, INC, ISC,     // 0xE0 - 0xEF
        BEQ, SBC, JAM, ISC, DOP, SBC, INC, ISC, SED, SBC, NOP, ISC, NOP, SBC, INC, ISC      // 0xF0 - 0xFF
    ];

    var address_mode = [
        IMPLIED, INDIRECTX, IMPLIED, INDIRECTX, IMPLIED, ZEROPAGE, ZEROPAGE, ZEROPAGE,      // 0x00 - 0x07
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, IMPLIED, ABSOLUTE, ABSOLUTE, ABSOLUTE,      // 0x08 - 0x0F
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0x10 - 0x17
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, // 0x18 - 0x1F
        ABSOLUTE, INDIRECTX, IMPLIED, INDIRECTX, ZEROPAGE, ZEROPAGE, ZEROPAGE, ZEROPAGE,    // 0x20 - 0x27
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0x28 - 0x2F
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0x30 - 0x37
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, // 0x38 - 0x3F
        IMPLIED, INDIRECTX, IMPLIED, INDIRECTX, IMPLIED, ZEROPAGE, ZEROPAGE, ZEROPAGE,      // 0x40 - 0x47
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0x48 - 0x4F
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0x50 - 0x57
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, // 0x58 - 0x5F
        IMPLIED, INDIRECTX, IMPLIED, INDIRECTX, IMPLIED, ZEROPAGE, ZEROPAGE, ZEROPAGE,      // 0x60 - 0x67
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, INDIRECT, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0x68 - 0x6F
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0x70 - 0x77
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, // 0x78 - 0x7F
        IMPLIED, INDIRECTX, IMPLIED, INDIRECTX, ZEROPAGE, ZEROPAGE, ZEROPAGE, ZEROPAGE,     // 0x80 - 0x87
        IMPLIED, IMPLIED, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,       // 0x88 - 0x8F
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, ZEROPAGEX, ZEROPAGEX, ZEROPAGEY, ZEROPAGEY,// 0x90 - 0x97
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEY, ABSOLUTEY, // 0x98 - 0x9F
        IMMEDIATE, INDIRECTX, IMMEDIATE, INDIRECTX, ZEROPAGE, ZEROPAGE, ZEROPAGE, ZEROPAGE, // 0xA0 - 0xA7
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0xA8 - 0xAF
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, ZEROPAGEX, ZEROPAGEX, ZEROPAGEY, ZEROPAGEY,// 0xB0 - 0xB7
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEY, ABSOLUTEY, // 0xB8 - 0xBF
        IMMEDIATE, INDIRECTX, IMPLIED, INDIRECTX, ZEROPAGE, ZEROPAGE, ZEROPAGE, ZEROPAGE,   // 0xC0 - 0xC7
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0xC8 - 0xCF
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0xD0 - 0xD7
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, // 0xD8 - 0xDF
        IMMEDIATE, INDIRECTX, IMPLIED, INDIRECTX, ZEROPAGE, ZEROPAGE, ZEROPAGE, ZEROPAGE,   // 0xE0 - 0xE7
        IMPLIED, IMMEDIATE, IMPLIED, IMMEDIATE, ABSOLUTE, ABSOLUTE, ABSOLUTE, ABSOLUTE,     // 0xE8 - 0xE8
        RELATIVE, INDIRECTY, IMPLIED, INDIRECTY, IMPLIED, ZEROPAGEX, ZEROPAGEX, ZEROPAGEX,  // 0xF0 - 0xF7
        IMPLIED, ABSOLUTEY, IMPLIED, ABSOLUTEY, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX, ABSOLUTEX  // 0xF8 - 0xFF
    ];

    var cycle_times = [
        7, 6, 0, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6, // 0x00 - 0x0F
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 0x10 - 0x1F
        6, 6, 0, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6, // 0x20 - 0x2F
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 0x30 - 0x3F
        6, 6, 0, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6, // 0x40 - 0x4F
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 0x50 - 0x5F
        6, 6, 0, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6, // 0x60 - 0x6F
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 0x70 - 0x7F
        2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, // 0x80 - 0x8F
        2, 6, 0, 6, 4, 4, 4, 4, 2, 5, 2, 5, 5, 5, 5, 5, // 0x90 - 0x9F
        2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, // 0xA0 - 0xAF
        2, 5, 0, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4, // 0xB0 - 0xBF
        2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, // 0xC0 - 0xCF
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 0xD0 - 0xDF
        2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, // 0xE0 - 0xEF
        2, 5, 0, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7  // 0xF0 - 0xFF
    ];

    var check_page_boundaries = {
        0x11: true, 0x19: true, 0x1C: true, 0x1D: true, 0x31: true, 0x39: true, 0x3C: true,
        0x3D: true, 0x51: true, 0x59: true, 0x5C: true, 0x5D: true, 0x71: true, 0x79: true,
        0x7C: true, 0x7D: true, 0xB1: true, 0xB3: true, 0xB9: true, 0xBB: true, 0xBC: true,
        0xBD: true, 0xBE: true, 0xBF: true, 0xD1: true, 0xD9: true, 0xDC: true, 0xDD: true,
        0xE3: true, 0xF1: true, 0xF9: true, 0xFC: true, 0xFD: true
    }

    /* PUBLIC METHODS */
    return {
        load: load,
        execute: execute,
        get_memory: get_memory,
        is_running: is_running
    };
}());
