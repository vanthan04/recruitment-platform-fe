export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-xs italic">
      <span className="flex gap-0.5">
        <span className="bg-muted-foreground size-1 animate-bounce rounded-full [animation-delay:-0.3s]" />
        <span className="bg-muted-foreground size-1 animate-bounce rounded-full [animation-delay:-0.15s]" />
        <span className="bg-muted-foreground size-1 animate-bounce rounded-full" />
      </span>
      {label} đang nhập...
    </div>
  );
}
