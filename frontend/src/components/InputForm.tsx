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
    <div className="space-y-2">
      <label
        htmlFor="user-input"
        className="block text-xs font-medium text-slate-400"
      >
        Input
      </label>
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
        placeholder="Enter your input text..."
        rows={4}
        disabled={isRunning}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2
                   text-sm text-slate-100 placeholder-slate-500 resize-none
                   focus:outline-none focus:ring-1 focus:ring-blue-500
                   disabled:opacity-50"
      />
      <button
        onClick={onRun}
        disabled={disabled}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600
                   disabled:cursor-not-allowed text-white text-sm font-medium
                   py-2 px-4 rounded-md transition-colors"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin text-xs">⟳</span>
            Running...
          </span>
        ) : (
          "Run Pipeline"
        )}
      </button>
      <p className="text-[10px] text-slate-500 text-center">⌘ + Enter to run</p>
    </div>
  );
}
