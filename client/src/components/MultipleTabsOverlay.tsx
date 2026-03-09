import { useEffect, useState } from 'react';
import { Wind, AlertTriangle } from 'lucide-react';

const CHANNEL = 'windwatch-tabs';

export default function MultipleTabsOverlay() {
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);

    channel.onmessage = (e: MessageEvent<string>) => {
      if (e.data === 'ping') {
        // Another tab just opened — tell it we exist
        channel.postMessage('pong');
      }
      if (e.data === 'pong') {
        // An existing tab replied — we're the duplicate
        setIsDuplicate(true);
      }
      if (e.data === 'close') {
        // The primary tab closed — we can take over
        setIsDuplicate(false);
        channel.postMessage('ping');
      }
    };

    // Announce ourselves — existing tabs will reply
    channel.postMessage('ping');

    const handleUnload = () => channel.postMessage('close');
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      channel.postMessage('close');
      channel.close();
    };
  }, []);

  if (!isDuplicate) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1120]/90 backdrop-blur-sm">
      <div className="bg-card border border-edge rounded-2xl px-10 py-10 max-w-md w-full text-center shadow-2xl">
        <div className="w-14 h-14 rounded-xl bg-warning/[12%] border border-warning/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-warning" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wind size={16} className="text-faint" />
          <span className="text-[0.75rem] text-faint font-medium uppercase tracking-widest">WindWatch</span>
        </div>
        <h2 className="text-[1.4rem] font-bold text-ink tracking-tight mb-3">App already open</h2>
        <p className="text-dim text-[0.9rem] leading-relaxed mb-7">
          WindWatch is running in another tab. Multiple tabs can interfere with real-time data connections.
        </p>
        <button
          onClick={() => window.close()}
          className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-surface text-[0.85rem] font-semibold cursor-pointer hover:bg-sky-300 transition-colors border-none"
        >
          Close this tab
        </button>
      </div>
    </div>
  );
}
