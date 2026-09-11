import { useMemo, useState, type ClipboardEvent } from 'react';
import {
  addEntry,
  deleteEntry,
  loadEntries,
  updateEntry,
  type ReportEntry,
} from '../../storage/reports';
import {
  entriesInRange,
  generateReportHtml,
  generateReportText,
  resolvePeriod,
  type ReportPeriod,
  type ReportRange,
} from '../../processors/reportGenerator';
import { sanitizePaste } from '../../processors/pasteSanitizer';
import { useI18n } from '../../localization/i18n';
import { CopyButton } from '../../components/CopyButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LinkifiedText } from '../../components/LinkifiedText';
import { IconCircleX } from '../../components/icons';

function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateInputValue(v: string, endOfDay = false): number {
  const [y, m, d] = v.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (endOfDay) date.setHours(24, 0, 0, 0);
  return date.getTime();
}

export function DailyReport() {
  const { t, language } = useI18n();
  const [entries, setEntries] = useState<ReportEntry[]>(() => loadEntries());
  const [draft, setDraft] = useState('');
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(Date.now()));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(Date.now()));
  // Snapshot of the entries included in the generated report.
  const [reportEntries, setReportEntries] = useState<ReportEntry[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const range: ReportRange = useMemo(() => {
    const custom = {
      from: fromDateInputValue(customFrom),
      to: fromDateInputValue(customTo, true),
    };
    return resolvePeriod(period, Date.now(), custom);
  }, [period, customFrom, customTo]);

  const visible = useMemo(() => entriesInRange(entries, range), [entries, range]);

  const timeFormat = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dayFormat = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    day: 'numeric',
  });

  const add = () => {
    const text = draft.trim();
    if (text === '') return;
    setEntries(addEntry(text));
    setDraft('');
  };

  // Rich text pasted into the entry field is cleaned: styles are dropped,
  // lists and URLs survive.
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return; // plain text paste — let the browser handle it
    e.preventDefault();
    const cleaned = sanitizePaste(e.clipboardData.getData('text/plain'), html);
    const target = e.currentTarget;
    const start = target.selectionStart ?? draft.length;
    const end = target.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + cleaned + draft.slice(end));
  };

  // No title, no date, no comments — the report is the entries themselves.
  const makeReport = () => {
    setReportEntries(entriesInRange(entries, range));
  };

  const periods: ReportPeriod[] = ['today', 'yesterday', 'week', 'custom'];

  // Group visible entries by day for display (matters for week/custom ranges).
  const groups = useMemo(() => {
    const map = new Map<string, ReportEntry[]>();
    for (const e of visible) {
      const day = dayFormat.format(e.createdAt);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, language]);

  return (
    <div className="generic-tool">
      <div className="entry-add">
        <textarea
          className="text-area small"
          value={draft}
          placeholder={t('tools.daily-report.labels.entryPlaceholder')}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="btn btn-dark" onClick={add} disabled={draft.trim() === ''}>
          {t('tools.daily-report.labels.add')}
        </button>
      </div>

      <div className="mode-row">
        {periods.map((p) => (
          <button
            key={p}
            className={period === p ? 'btn btn-mode active' : 'btn btn-mode'}
            onClick={() => {
              setPeriod(p);
              setReportEntries(null);
            }}
          >
            {t(`tools.daily-report.labels.${p === 'week' ? 'week' : p}`)}
          </button>
        ))}
        {period === 'custom' && (
          <span className="date-range">
            <label>
              {t('tools.daily-report.labels.from')}{' '}
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label>
              {t('tools.daily-report.labels.to')}{' '}
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
          </span>
        )}
      </div>

      <div className="entries-list">
        {groups.length === 0 && <p className="empty-hint">{t('tools.daily-report.labels.noEntries')}</p>}
        {groups.map(([day, dayEntries]) => (
          <div key={day} className="entry-group">
            <h4>{day}</h4>
            {dayEntries.map((entry) => (
              <div key={entry.id} className="entry">
                <span className="entry-time">{timeFormat.format(entry.createdAt)}</span>
                {editingId === entry.id ? (
                  <div className="entry-edit">
                    <textarea
                      className="text-area small"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEntries(updateEntry(entry.id, editText.trim() || entry.text));
                        setEditingId(null);
                      }}
                    >
                      {t('tools.daily-report.labels.save')}
                    </button>
                  </div>
                ) : (
                  <span className="entry-text">
                    <LinkifiedText text={entry.text} />
                  </span>
                )}
                <span className="entry-actions">
                  <button
                    className="btn-link"
                    onClick={() => {
                      setEditingId(entry.id);
                      setEditText(entry.text);
                    }}
                  >
                    {t('tools.daily-report.labels.edit')}
                  </button>
                  <button
                    className="icon-btn"
                    title={t('tools.daily-report.labels.delete')}
                    onClick={() => setPendingDelete(entry.id)}
                  >
                    <IconCircleX />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {reportEntries !== null && (
        <>
          <div className="field-header">
            <label>{t('tools.daily-report.labels.report')}</label>
          </div>
          <div className="report-view">
            {reportEntries.length === 0 && (
              <span className="empty-hint">{t('tools.daily-report.labels.noEntries')}</span>
            )}
            {reportEntries.map((entry) => (
              <div key={entry.id} className="report-line">
                <span className="report-bullet" aria-hidden>
                  •
                </span>
                <span>
                  <LinkifiedText text={entry.text} />
                </span>
              </div>
            ))}
          </div>
          <div className="action-row">
            <CopyButton
              text={generateReportText(reportEntries)}
              html={generateReportHtml(reportEntries)}
            />
            <button className="btn" onClick={() => setReportEntries(null)}>
              {t('common.clear')}
            </button>
          </div>
        </>
      )}

      {/* Pinned to the bottom of the pane, like the mockup's footer bar. */}
      <div className="tool-footer report-footer">
        <button className="btn btn-primary btn-cta" onClick={makeReport}>
          {t('tools.daily-report.labels.generate')}
        </button>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('tools.daily-report.labels.deleteConfirm')}
        body=""
        cancelLabel={t('settings.cancel')}
        confirmLabel={t('tools.daily-report.labels.delete')}
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) setEntries(deleteEntry(pendingDelete));
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
