interface InputFormProps {
  userInput: string;
  isRunning: boolean;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onRun: () => void;
}

export default function InputForm({
  userInput,
  isRunning,
  disabled,
  onInputChange,
  onRun,
}: InputFormProps) {
  return (
    <div>
      <textarea
        id="user-input"
        value={userInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey && !disabled) {
            e.preventDefault();
            onRun();
          }
        }}
        placeholder="Enter input signal..."
        rows={4}
        disabled={isRunning}
        style={{
          width: '100%',
          background: 'var(--void)',
          border: '1px solid var(--border)',
          borderRadius: 0,
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-primary)',
          resize: 'none',
          outline: 'none',
          caretColor: 'var(--phosphor)',
          opacity: isRunning ? 0.4 : 1,
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-bright)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />

      <button
        onClick={onRun}
        disabled={disabled}
        className={isRunning ? 'btn-executing' : ''}
        style={{
          width: '100%',
          marginTop: 8,
          padding: '10px 0',
          border: isRunning ? '1px solid var(--amber)' : '1px solid var(--phosphor-dim)',
          borderRadius: 0,
          background: 'transparent',
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          letterSpacing: '0.1em',
          color: isRunning ? 'var(--amber)' : 'var(--phosphor)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled && !isRunning ? 0.3 : 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'var(--phosphor)';
            e.currentTarget.style.color = '#000';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = isRunning ? 'var(--amber)' : 'var(--phosphor)';
        }}
      >
        {isRunning ? '◈ EXECUTING...' : '▶ EXECUTE'}
      </button>

      <div
        style={{
          marginTop: 6,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
        }}
      >
        ⌘+ENTER
      </div>
    </div>
  );
}
