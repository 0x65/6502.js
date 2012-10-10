6502.js
=======

A JavaScript emulator of the 6502 microprocessor. It features:

- Support for all the undocumented opcodes
- Accurate cycle counting, including when address modes cross page boundaries
- (Slightly) faster speed than some of the other JS implementations

Known Issues
------------
- The overflow flag is not reliable coming from decimal mode math, as documentation for this is not clear

