import { FormEvent, KeyboardEvent, useMemo, useState } from 'react';
import type { DeviceSummary, PayloadFilter } from '../lib/types';

const MAX_SUGGESTIONS = 8;

interface Props {
  controllerId: number | null;
  onControllerIdChange: (id: number | null) => void;
  // Every known device (window=all), for name/id autocomplete. May be empty
  // while the list is still loading.
  suggestions: DeviceSummary[];
  // Live text in the search input. Lifted to the parent so the device list
  // can filter as the user types, while submit (Enter or the Search button)
  // still navigates straight to the matched controller.
  searchText: string;
  onSearchTextChange: (text: string) => void;
  filters: PayloadFilter[];
  onFiltersChange: (filters: PayloadFilter[]) => void;
  filterText: string;
  onFilterTextChange: (text: string) => void;
}

// Search bar with two affordances:
//   1. Name / controller-identifier lookup with autocomplete that doubles as
//      a live filter on the device list (the primary use case per the spec).
//   2. Stacked decoded-payload filters using the same `path[=op]:value`
//      grammar as the backend's parseFilterParam, so what you type here
//      maps 1:1 to backend filtering on the per-device history view.
export function SearchBar({
  controllerId,
  onControllerIdChange,
  suggestions,
  searchText,
  onSearchTextChange,
  filters,
  onFiltersChange,
  filterText,
  onFilterTextChange,
}: Props): JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const matches = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return suggestions
      .filter(
        (d) =>
          (d.name ?? '').toLowerCase().includes(q) ||
          String(d.controllerId).startsWith(trimmed)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [suggestions, searchText]);

  function pick(d: DeviceSummary): void {
    onSearchTextChange(d.name ?? String(d.controllerId));
    onControllerIdChange(d.controllerId);
    setDropdownOpen(false);
    setHighlight(-1);
  }

  function submit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setDropdownOpen(false);
    if (highlight >= 0 && highlight < matches.length) {
      pick(matches[highlight]);
      return;
    }
    const parsed = parseInt(searchText, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onControllerIdChange(parsed);
    } else if (matches.length > 0) {
      pick(matches[0]);
    } else if (!searchText.trim()) {
      onControllerIdChange(null);
    }
  }

  function searchKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDropdownOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setHighlight(-1);
    }
  }

  function addFilter(): void {
    const f = parseFilterText(filterText);
    if (!f) return;
    onFiltersChange([...filters, f]);
    onFilterTextChange('');
  }

  function removeFilter(idx: number): void {
    onFiltersChange(filters.filter((_, i) => i !== idx));
  }

  return (
    <div className="border-b border-ink-200 bg-white px-4 py-3 space-y-2">
      <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-ink-600" htmlFor="controller-search">
          Controller
        </label>
        <div className="relative flex-1 min-w-[160px] w-full sm:w-auto sm:max-w-[320px]">
          <input
            id="controller-search"
            type="text"
            autoComplete="off"
            placeholder="Search by name or identifier (e.g. Cabin Air, 1042)"
            value={searchText}
            onChange={(e) => {
              onSearchTextChange(e.target.value);
              setDropdownOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => {
              // Delay so a mousedown on a suggestion wins over the blur.
              setTimeout(() => setDropdownOpen(false), 150);
            }}
            onKeyDown={searchKeyDown}
            className="w-full px-3 py-1.5 border border-ink-200 rounded text-sm"
            role="combobox"
            aria-expanded={dropdownOpen && matches.length > 0}
            aria-controls="controller-search-suggestions"
            aria-autocomplete="list"
          />
          {dropdownOpen && matches.length > 0 && (
            <ul
              id="controller-search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded shadow-lg z-20 overflow-hidden"
            >
              {matches.map((d, i) => (
                <li key={d.controllerId} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    // mousedown, not click: fires before the input's blur
                    // closes the dropdown.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(d);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                      i === highlight ? 'bg-ink-100' : ''
                    }`}
                  >
                    <span className="truncate">
                      {d.name ?? `Controller #${d.controllerId}`}
                    </span>
                    <span className="ml-auto font-mono text-xs text-ink-400 shrink-0">
                      #{d.controllerId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 bg-ink-800 text-white rounded text-sm"
        >
          Open controller
        </button>
        {(controllerId || searchText) && (
          <button
            type="button"
            onClick={() => {
              onSearchTextChange('');
              onControllerIdChange(null);
            }}
            className="text-sm text-ink-500 hover:text-ink-900"
          >
            Clear
          </button>
        )}
      </form>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Payload filter: hvac.mode=cool  or  hvac.temperature=gt:70"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFilter();
            }
          }}
          className="flex-1 px-3 py-1.5 border border-ink-200 rounded text-xs font-mono"
        />
        <button
          onClick={addFilter}
          className="px-2.5 py-1 border border-ink-300 text-ink-700 rounded text-xs"
        >
          Add filter
        </button>
        {filters.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-ink-100 text-ink-800 rounded px-2 py-0.5 text-xs font-mono"
          >
            {f.path} {f.op !== 'eq' ? f.op : '='} {String(f.value)}
            <button
              onClick={() => removeFilter(i)}
              className="text-ink-500 hover:text-ink-900"
              aria-label="Remove filter"
            >
              {'\u00d7'}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Mirrors src/services/protoDecoder.ts#parseFilterParam on the API. Keep
// in sync if the grammar evolves.
function parseFilterText(s: string): PayloadFilter | null {
  const t = s.trim();
  if (!t) return null;
  const eq = t.indexOf('=');
  if (eq < 0) return null;
  const path = t.slice(0, eq).trim();
  const rhs = t.slice(eq + 1).trim();
  if (!path) return null;
  const colon = rhs.indexOf(':');
  let op: PayloadFilter['op'] = 'eq';
  let value: string | number | boolean = rhs;
  if (colon > 0) {
    const cand = rhs.slice(0, colon).toLowerCase();
    if (
      ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists'].includes(cand)
    ) {
      op = cand as PayloadFilter['op'];
      value = rhs.slice(colon + 1);
    }
  } else if (rhs === 'exists') {
    return { path, op: 'exists', value: true };
  }
  if (typeof value === 'string' && op !== 'contains' && op !== 'exists') {
    const n = Number(value);
    if (!Number.isNaN(n) && value !== '') value = n;
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;
  }
  return { path, op, value };
}

export function filtersToQuery(filters: PayloadFilter[]): string[] {
  return filters.map((f) =>
    f.op === 'exists'
      ? `${f.path}=exists`
      : f.op === 'eq'
      ? `${f.path}=${String(f.value)}`
      : `${f.path}=${f.op}:${String(f.value)}`
  );
}
