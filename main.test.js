'use strict';

const { expect } = require('chai');
const { mergeDeviceTables, nameToId, normalizeAddress, parseSymbolTable } = require('./lib/symbol-table');

describe('CX-Programmer symbol import', () => {
    it('parses semicolon separated exports', () => {
        const result = parseSymbolTable('Name;Address;Data Type\nMotor ready;CIO 0.01;BOOL\nCounter;D100;UINT');
        expect(result).to.have.length(2);
        expect(result[0]).to.include({
            name: 'Motor ready',
            value: 'CIO0.01',
            type: 'BOOL',
        });
        expect(result[1]).to.include({
            name: 'Counter',
            value: 'D100',
            type: 'NUMBER',
        });
    });
    it('supports legacy adapter address notation', () => {
        expect(normalizeAddress('CB0:00')).to.equal('CIO0.00');
        expect(normalizeAddress('W31:01')).to.equal('W31.01');
    });
    it('creates stable IDs and lets manual values override imports', () => {
        expect(nameToId('Motor bereit / 1')).to.equal('Motor_bereit_1');
        const merged = mergeDeviceTables(
            [{ name: 'Motor', value: 'D2', type: 'NUMBER' }],
            [{ name: 'Motor', value: 'D1', type: 'BOOL' }],
        );
        expect(merged[0]).to.include({ value: 'D2', type: 'NUMBER' });
    });
});
