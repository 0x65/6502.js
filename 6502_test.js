// Tests based on AllSuiteA.asm from the hmc-6502 project
// Assembly code for the tests can be found here: http://code.google.com/p/hmc-6502/source/browse/trunk/emu/testvectors/AllSuiteA.asm

function test(bytecode, assertion) {
    cpu.load(bytecode, 0x600);

    while (cpu.is_running())
        cpu.execute();

    if (assertion())
        document.write("Passed test: " + assertion + "<br/>");
    else
        document.write("Failed test: " + assertion + "<br/>");
}

test([0xa9, 0x55, 0xa2, 0x2a, 0xa0, 0x73, 0x85, 0x81, 0xa9, 0x01, 0x85, 0x61, 0xa9, 0x7e, 0xa5, 0x81, 0x8d, 0x10, 0x09, 0xa9, 0x7e, 0xad, 0x10, 0x09, 0x95, 0x56, 0xa9, 0x7e, 0xb5, 0x56, 0x84, 0x60, 0x91, 0x60, 0xa9, 0x7e, 0xb1, 0x60, 0x9d, 0xff, 0x07, 0xa9, 0x7e, 0xbd, 0xff, 0x07, 0x99, 0xff, 0x07, 0xa9, 0x7e, 0xb9, 0xff, 0x07, 0x81, 0x36, 0xa9, 0x7e, 0xa1, 0x36, 0x86, 0x50, 0xa6, 0x60, 0xa4, 0x50, 0x8e, 0x13, 0x09, 0xa2, 0x22, 0xae, 0x13, 0x09, 0x8c, 0x14, 0x09, 0xa0, 0x99, 0xac, 0x14, 0x09, 0x94, 0x2d, 0x96, 0x77, 0xa0, 0x99, 0xb4, 0x2d, 0xa2, 0x22, 0xb6, 0x77, 0xa0, 0x99, 0xbc, 0xa0, 0x08, 0xa2, 0x22, 0xbe, 0xa1, 0x08, 0x9d, 0x00, 0x02], function() { return (cpu.get_memory(0x022A)==0x55); });

test([0xa9, 0x55, 0x29, 0x53, 0x09, 0x38, 0x49, 0x11, 0x85, 0x99, 0xa9, 0xb9, 0x85, 0x10, 0xa9, 0xe7, 0x85, 0x11, 0xa9, 0x39, 0x85, 0x12, 0xa5, 0x99, 0x25, 0x10, 0x05, 0x11, 0x45, 0x12, 0xa2, 0x10, 0x85, 0x99, 0xa9, 0xbc, 0x85, 0x20, 0xa9, 0x31, 0x85, 0x21, 0xa9, 0x17, 0x85, 0x22, 0xa5, 0x99, 0x35, 0x10, 0x15, 0x11, 0x55, 0x12, 0x85, 0x99, 0xa9, 0x6f, 0x8d, 0x10, 0x01, 0xa9, 0x3c, 0x8d, 0x11, 0x01, 0xa9, 0x27, 0x8d, 0x12, 0x01, 0xa5, 0x99, 0x2d, 0x10, 0x01, 0x0d, 0x11, 0x01, 0x4d, 0x12, 0x01, 0x85, 0x99, 0xa9, 0x8a, 0x8d, 0x20, 0x01, 0xa9, 0x47, 0x8d, 0x21, 0x01, 0xa9, 0x8f, 0x8d, 0x22, 0x01, 0xa5, 0x99, 0x3d, 0x10, 0x01, 0x1d, 0x11, 0x01, 0x5d, 0x12, 0x01, 0xa0, 0x20, 0x85, 0x99, 0xa9, 0x73, 0x8d, 0x30, 0x01, 0xa9, 0x2a, 0x8d, 0x31, 0x01, 0xa9, 0xf1, 0x8d, 0x32, 0x01, 0xa5, 0x99, 0x39, 0x10, 0x01, 0x19, 0x11, 0x01, 0x59, 0x12, 0x01, 0x85, 0x99, 0xa9, 0x70, 0x85, 0x30, 0xa9, 0x01, 0x85, 0x31, 0xa9, 0x71, 0x85, 0x32, 0xa9, 0x01, 0x85, 0x33, 0xa9, 0x72, 0x85, 0x34, 0xa9, 0x01, 0x85, 0x35, 0xa9, 0xc5, 0x8d, 0x70, 0x01, 0xa9, 0x7c, 0x8d, 0x71, 0x01, 0xa9, 0xa1, 0x8d, 0x72, 0x01, 0xa5, 0x99, 0x21, 0x20, 0x01, 0x22, 0x41, 0x24, 0x85, 0x99, 0xa9, 0x60, 0x85, 0x40, 0xa9, 0x01, 0x85, 0x41, 0xa9, 0x61, 0x85, 0x42, 0xa9, 0x01, 0x85, 0x43, 0xa9, 0x62, 0x85, 0x44, 0xa9, 0x01, 0x85, 0x45, 0xa9, 0x37, 0x8d, 0x50, 0x02, 0xa9, 0x23, 0x8d, 0x51, 0x02, 0xa9, 0x9d, 0x8d, 0x52, 0x02, 0xa5, 0x99, 0xa0, 0xf0, 0x31, 0x40, 0x11, 0x42, 0x51, 0x44, 0x85, 0xa9], function() { return (cpu.get_memory(0x00A9)==0xAA); });

test([0xa9, 0xff, 0xa2, 0x00, 0x85, 0x90, 0xe6, 0x90, 0xe6, 0x90, 0xa5, 0x90, 0xa6, 0x90, 0x95, 0x90, 0xf6, 0x90, 0xb5, 0x90, 0xa6, 0x91, 0x9d, 0x90, 0x01, 0xee, 0x92, 0x01, 0xbd, 0x90, 0x01, 0xae, 0x92, 0x01, 0x9d, 0x90, 0x01, 0xfe, 0x90, 0x01, 0xbd, 0x90, 0x01, 0xae, 0x93, 0x01, 0x9d, 0x70, 0x01, 0xde, 0x70, 0x01, 0xbd, 0x70, 0x01, 0xae, 0x74, 0x01, 0x9d, 0x70, 0x01, 0xce, 0x73, 0x01, 0xbd, 0x70, 0x01, 0xae, 0x73, 0x01, 0x95, 0x70, 0xd6, 0x70, 0xb5, 0x70, 0xa6, 0x72, 0x95, 0x70, 0xc6, 0x71, 0xc6, 0x71], function() { return (cpu.get_memory(0x0071)==0xFF); });

test([0xa9, 0x4b, 0x4a, 0x0a, 0x85, 0x50, 0x06, 0x50, 0x06, 0x50, 0x46, 0x50, 0xa5, 0x50, 0xa6, 0x50, 0x09, 0xc9, 0x85, 0x60, 0x16, 0x4c, 0x56, 0x4c, 0x56, 0x4c, 0xb5, 0x4c, 0xa6, 0x60, 0x09, 0x41, 0x8d, 0x2e, 0x01, 0x5e, 0x00, 0x01, 0x5e, 0x00, 0x01, 0x1e, 0x00, 0x01, 0xbd, 0x00, 0x01, 0xae, 0x2e, 0x01, 0x09, 0x81, 0x9d, 0x00, 0x01, 0x4e, 0x36, 0x01, 0x4e, 0x36, 0x01, 0x0e, 0x36, 0x01, 0xbd, 0x00, 0x01, 0x2a, 0x2a, 0x6a, 0x85, 0x70, 0xa6, 0x70, 0x09, 0x03, 0x95, 0x0c, 0x26, 0xc0, 0x66, 0xc0, 0x66, 0xc0, 0xb5, 0x0c, 0xa6, 0xc0, 0x85, 0xd0, 0x36, 0x75, 0x36, 0x75, 0x76, 0x75, 0xa5, 0xd0, 0xa6, 0xd0, 0x9d, 0x00, 0x01, 0x2e, 0xb7, 0x01, 0x2e, 0xb7, 0x01, 0x2e, 0xb7, 0x01, 0x6e, 0xb7, 0x01, 0xbd, 0x00, 0x01, 0xae, 0xb7, 0x01, 0x8d, 0xdd, 0x01, 0x3e, 0x00, 0x01, 0x7e, 0x00, 0x01, 0x7e, 0x00, 0x01], function() { return (cpu.get_memory(0x01DD)==0x6E); });

test([0xa9, 0x35, 0xaa, 0xca, 0xca, 0xe8, 0x8a, 0xa8, 0x88, 0x88, 0xc8, 0x98, 0xaa, 0xa9, 0x20, 0x9a, 0xa2, 0x10, 0xba, 0x8a, 0x85, 0x40], function() { return (cpu.get_memory(0x0040)==0x33); });

test([0xa9, 0x6a, 0x85, 0x50, 0xa9, 0x6b, 0x85, 0x51, 0xa9, 0xa1, 0x85, 0x60, 0xa9, 0xa2, 0x85, 0x61, 0xa9, 0xff, 0x69, 0xff, 0x69, 0xff, 0xe9, 0xae, 0x85, 0x40, 0xa6, 0x40, 0x75, 0x00, 0xf5, 0x01, 0x65, 0x60, 0xe5, 0x61, 0x8d, 0x20, 0x01, 0xa9, 0x4d, 0x8d, 0x21, 0x01, 0xa9, 0x23, 0x6d, 0x20, 0x01, 0xed, 0x21, 0x01, 0x85, 0xf0, 0xa6, 0xf0, 0xa9, 0x64, 0x8d, 0x24, 0x01, 0xa9, 0x62, 0x8d, 0x25, 0x01, 0xa9, 0x26, 0x7d, 0x00, 0x01, 0xfd, 0x01, 0x01, 0x85, 0xf1, 0xa4, 0xf1, 0xa9, 0xe5, 0x8d, 0x28, 0x01, 0xa9, 0xe9, 0x8d, 0x29, 0x01, 0xa9, 0x34, 0x79, 0x00, 0x01, 0xf9, 0x01, 0x01, 0x85, 0xf2, 0xa6, 0xf2, 0xa9, 0x20, 0x85, 0x70, 0xa9, 0x01, 0x85, 0x71, 0xa9, 0x24, 0x85, 0x72, 0xa9, 0x01, 0x85, 0x73, 0x61, 0x41, 0xe1, 0x3f, 0x85, 0xf3, 0xa4, 0xf3, 0xa9, 0xda, 0x85, 0x80, 0xa9, 0x00, 0x85, 0x81, 0xa9, 0xdc, 0x85, 0x82, 0xa9, 0x00, 0x85, 0x83, 0xa9, 0xaa, 0x71, 0x80, 0xf1, 0x82, 0x85, 0x30], function() { return (cpu.get_memory(0x0030)==0x9D); });

test([0xa9, 0x00, 0x85, 0x34, 0xa9, 0xff, 0x8d, 0x30, 0x01, 0xa9, 0x99, 0x8d, 0x9d, 0x01, 0xa9, 0xdb, 0x8d, 0x99, 0x01, 0xa9, 0x2f, 0x85, 0x32, 0xa9, 0x32, 0x85, 0x4f, 0xa9, 0x30, 0x85, 0x33, 0xa9, 0x70, 0x85, 0xaf, 0xa9, 0x18, 0x85, 0x30, 0xc9, 0x18, 0xf0, 0x02, 0x29, 0x00, 0x09, 0x01, 0xc5, 0x30, 0xd0, 0x02, 0x29, 0x00, 0xa2, 0x00, 0xcd, 0x30, 0x01, 0xf0, 0x04, 0x85, 0x40, 0xa6, 0x40, 0xd5, 0x27, 0xd0, 0x06, 0x09, 0x84, 0x85, 0x41, 0xa6, 0x41, 0x29, 0xdb, 0xdd, 0x00, 0x01, 0xf0, 0x02, 0x29, 0x00, 0x85, 0x42, 0xa4, 0x42, 0x29, 0x00, 0xd9, 0x00, 0x01, 0xd0, 0x02, 0x09, 0x0f, 0x85, 0x43, 0xa6, 0x43, 0x09, 0x24, 0xc1, 0x40, 0xf0, 0x02, 0x09, 0x7f, 0x85, 0x44, 0xa4, 0x44, 0x49, 0x0f, 0xd1, 0x33, 0xd0, 0x04, 0xa5, 0x44, 0x85, 0x15], function() { return (cpu.get_memory(0x0015)==0x7F); });

test([0xa9, 0xa5, 0x85, 0x20, 0x8d, 0x20, 0x01, 0xa9, 0x5a, 0x85, 0x21, 0xa2, 0xa5, 0xe0, 0xa5, 0xf0, 0x02, 0xa2, 0x01, 0xe4, 0x20, 0xf0, 0x02, 0xa2, 0x02, 0xec, 0x20, 0x01, 0xf0, 0x02, 0xa2, 0x03, 0x86, 0x30, 0xa4, 0x30, 0xc0, 0xa5, 0xf0, 0x02, 0xa0, 0x04, 0xc4, 0x20, 0xf0, 0x02, 0xa0, 0x05, 0xcc, 0x20, 0x01, 0xf0, 0x02, 0xa0, 0x06, 0x84, 0x31, 0xa5, 0x31, 0x24, 0x20, 0xd0, 0x02, 0xa9, 0x07, 0x2c, 0x20, 0x01, 0xd0, 0x02, 0xa9, 0x08, 0x24, 0x21, 0xd0, 0x02, 0x85, 0x42], function() { return (cpu.get_memory(0x0042)==0xA5); });

test([0xa9, 0x54, 0x85, 0x32, 0xa9, 0xb3, 0x85, 0xa1, 0xa9, 0x87, 0x85, 0x43, 0xa2, 0xa1, 0x10, 0x02, 0xa2, 0x32, 0xb4, 0x00, 0x10, 0x04, 0xa9, 0x05, 0xa6, 0xa1, 0x30, 0x02, 0xe9, 0x03, 0x30, 0x02, 0xa9, 0x41, 0x49, 0x30, 0x85, 0x32, 0x75, 0x00, 0x50, 0x02, 0xa9, 0x03, 0x85, 0x54, 0xb6, 0x00, 0x75, 0x51, 0x50, 0x02, 0xa9, 0xe5, 0x75, 0x40, 0x70, 0x05, 0x99, 0x01, 0x00, 0x65, 0x55, 0x70, 0x02, 0xa9, 0x00, 0x69, 0xf0, 0x90, 0x04, 0x85, 0x60, 0x65, 0x43, 0x90, 0x02, 0xa9, 0xff, 0x65, 0x54, 0xb0, 0x04, 0x69, 0x87, 0xa6, 0x60, 0xb0, 0x02, 0xa9, 0x00, 0x95, 0x73], function() { return (cpu.get_memory(0x0080)==0x1F); });

test([0xa9, 0x99, 0x69, 0x87, 0x18, 0xea, 0x90, 0x04, 0x69, 0x60, 0x69, 0x93, 0x38, 0xea, 0x90, 0x01, 0xb8, 0x50, 0x02, 0xa9, 0x00, 0x69, 0xad, 0xea, 0x85, 0x30], function() { return (cpu.get_memory(0x0030)==0xCE); });

test([0xa9, 0x27, 0x69, 0x01, 0x38, 0x08, 0x18, 0x28, 0x69, 0x00, 0x48, 0xa9, 0x00, 0x68, 0x85, 0x30], function() { return (cpu.get_memory(0x0030)==0x29); });

test([0x18, 0xa9, 0x42, 0xB0, 0x04, 0x85, 0x33, 0xb0, 0x0a, 0xa9, 0x45, 0x48, 0xa9, 0x61, 0x48, 0x38, 0x08, 0x18, 0x40], function() { return (cpu.get_memory(0x0033)==0x42); });

test([0x78, 0xf8, 0x08, 0x68, 0x85, 0x20, 0x58, 0xd8, 0x08, 0x68, 0x65, 0x20, 0x85, 0x21], function() { return (cpu.get_memory(0x0021)==0x6C); });
