import { useMemo, useState } from 'react';
import { useI18n } from '../../localization/i18n';
import { loadEntries, deleteEntry, type ReportEntry } from '../../storage/reports';
import { LinkifiedText } from '../../components/LinkifiedText';
import { CopyButton } from '../../components/CopyButton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { generateReportHtml, generateReportText } from '../../processors/reportGenerator';
import { IconCircleX } from '../../components/icons';

/**
 * The Daily Report ARCHIVE view — every entry ever recorded, grouped by day
 * (read + copy-as-report + delete; same storage as the report itself).
 * Lives in the Daily Report pinned section (sub-item «Архив»); it moved out
 * of the global Archive panel, which now holds archived tools only.
 */
export function ReportArchive() {
  const { t, language } = useI18n();
  const [entries, setEntries] = useState<ReportEntry[]>(() => loadEntries());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const dayFormat = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormat = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const groups = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    const map = new Map<string, ReportEntry[]>();
    for (const e of sorted) {
      const day = dayFormat.format(e.createdAt);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    // Within a day show entries in chronological order.
    return [...map.entries()].map(([day, list]) => [day, list.reverse()] as const);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, language]);

  return (
    <div className="generic-tool report-archive">
      <p className="settings-hint">{t('archive.hint')}</p>
      {groups.length === 0 && <p className="empty-hint">{t('archive.empty')}</p>}

      {groups.map(([day, dayEntries]) => (
        <div key={day} className="entry-group">
          <div className="archive-day-header">
            <h4>{day}</h4>
            <CopyButton
              text={generateReportText(dayEntries)}
              html={generateReportHtml(dayEntries)}
              icon
            />
          </div>
          {dayEntries.map((entry) => (
            <div key={entry.id} className="entry">
              <span className="entry-time">{timeFormat.format(entry.createdAt)}</span>
              <span className="entry-text">
                <LinkifiedText text={entry.text} />
              </span>
              <span className="entry-actions">
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
