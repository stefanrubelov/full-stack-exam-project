import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({ page, totalPages, onPageChange, disabled }: Props) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  const btnBase = 'flex items-center justify-center min-w-[32px] h-8 px-2 text-[0.8rem] rounded-md border transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  const btnInactive = `${btnBase} border-edge bg-card text-dim hover:bg-lift`;
  const btnActive = `${btnBase} border-accent bg-accent/15 text-accent font-semibold`;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || disabled}
        className={btnInactive}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="flex items-center justify-center min-w-[32px] h-8 text-[0.8rem] text-faint select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            disabled={disabled}
            className={p === page ? btnActive : btnInactive}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || disabled}
        className={btnInactive}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
