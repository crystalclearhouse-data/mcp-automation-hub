import { logger } from '../utils/logger';

describe('logger', () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.env.MCP_LOG_LEVEL = 'debug';
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env.MCP_LOG_LEVEL;
  });

  it('writes info messages to stdout', () => {
    logger.info('test info message');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('[INFO]');
    expect(output).toContain('test info message');
  });

  it('writes error messages to stderr', () => {
    logger.error('test error message');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('[ERROR]');
    expect(output).toContain('test error message');
  });

  it('writes debug messages when level is debug', () => {
    process.env.MCP_LOG_LEVEL = 'debug';
    logger.debug('test debug message');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('[DEBUG]');
  });

  it('suppresses debug messages when level is info', () => {
    process.env.MCP_LOG_LEVEL = 'info';
    logger.debug('suppressed debug message');
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('includes ISO timestamp in log output', () => {
    logger.info('timestamp test');
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('serialises extra arguments as JSON', () => {
    logger.info('with args', { key: 'value' });
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('{"key":"value"}');
  });
});
