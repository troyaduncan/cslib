/**
 * Hex dump utility for debugging binary data
 */
export class HexDump {
  /**
   * Convert buffer to hex dump string
   */
  static dump(buffer: Buffer, offset: number = 0, length?: number): string {
    const len = length !== undefined ? Math.min(length, buffer.length - offset) : buffer.length - offset;
    const lines: string[] = [];
    const bytesPerLine = 16;

    for (let i = 0; i < len; i += bytesPerLine) {
      const lineOffset = offset + i;
      const lineBytes = buffer.slice(lineOffset, Math.min(lineOffset + bytesPerLine, offset + len));

      // Offset
      const offsetStr = lineOffset.toString(16).padStart(8, '0');

      // Hex bytes
      const hexParts: string[] = [];
      for (let j = 0; j < bytesPerLine; j++) {
        if (j < lineBytes.length) {
          hexParts.push(lineBytes[j].toString(16).padStart(2, '0'));
        } else {
          hexParts.push('  ');
        }
        if (j === 7) hexParts.push(' '); // Extra space in the middle
      }
      const hexStr = hexParts.join(' ');

      // ASCII representation
      const asciiParts: string[] = [];
      for (let j = 0; j < lineBytes.length; j++) {
        const byte = lineBytes[j];
        asciiParts.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
      }
      const asciiStr = asciiParts.join('');

      lines.push(`${offsetStr}  ${hexStr}  |${asciiStr}|`);
    }

    return lines.join('\n');
  }

  /**
   * Convert hex string to buffer
   */
  static fromHex(hex: string): Buffer {
    const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
    return Buffer.from(cleaned, 'hex');
  }

  /**
   * Convert buffer to hex string
   */
  static toHex(buffer: Buffer): string {
    return buffer.toString('hex');
  }

  /**
   * Pretty print buffer as hex dump
   */
  static print(buffer: Buffer, offset: number = 0, length?: number): void {
    console.log(this.dump(buffer, offset, length));
  }
}

export default HexDump;
