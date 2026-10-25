// src/components/Reader/ReaderSettingsPanel.jsx
import React from 'react';
import ReaderSheet from './ReaderSheet';
import { Slider } from '@react-spectrum/s2/Slider';
import { Switch } from '@react-spectrum/s2/Switch';
import { APP_THEMES, READER_FONTS } from '../../styles/designTokens';
import { useI18n } from '../../i18n/context';
import styles from './ReaderSettingsPanel.module.css';

export default function ReaderSettingsPanel({
  settings,
  updateSetting,
  onClose,
  format = 'epub',
}) {
  const { t } = useI18n();
  const isReflowable = ['epub', 'txt', 'md', 'html', 'docx'].includes(format);

  return (
    <ReaderSheet
      title={t('Reading settings')}
      onClose={onClose}
      isLowTray={true}
      noBackdrop={true}
      ariaLabel={t('Reading settings')}
    >
      <div className={styles.container}>
        {/* 1. Theme Swatches */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{t('Reader theme')}</h3>
          </div>
          <div className={styles.themeGrid} role="radiogroup" aria-label={t('Reader theme')}>
            {APP_THEMES.map(th => {
              const isActive = settings.theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`${styles.themeSwatch} ${isActive ? styles.themeSwatchActive : ''}`}
                  onClick={() => updateSetting('theme', th.id)}
                  style={{
                    backgroundColor: th.bg,
                    color: th.text,
                  }}
                >
                  <span className={styles.themeAa}>Aa</span>
                  <span className={styles.themeLabel}>{t(th.label)}</span>
                  {isActive && <span className={styles.checkBadge} aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Reading Mode: Cuộn | Phân trang */}
        {isReflowable && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>{t('Reading mode')}</h3>
            </div>
            <div className={styles.segmentedControl} role="radiogroup" aria-label={t('Reading mode')}>
              <button
                type="button"
                role="radio"
                aria-checked={settings.readingMode === 'scroll'}
                className={`${styles.segmentBtn} ${settings.readingMode === 'scroll' ? styles.segmentBtnActive : ''}`}
                onClick={() => updateSetting('readingMode', 'scroll')}
              >
                {t('Scroll')}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.readingMode === 'classic'}
                className={`${styles.segmentBtn} ${settings.readingMode === 'classic' ? styles.segmentBtnActive : ''}`}
                onClick={() => updateSetting('readingMode', 'classic')}
              >
                {t('Paginated')}
              </button>
            </div>
          </section>
        )}

        {/* 3. Typeface selection (Only for reflowable text formats) */}
        {isReflowable ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>{t('Typeface')}</h3>
            </div>
            <div className={styles.fontGrid} role="radiogroup" aria-label={t('Typeface')}>
              {READER_FONTS.map(f => {
                const isActive = settings.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`${styles.fontBtn} ${isActive ? styles.fontBtnActive : ''}`}
                    style={{ fontFamily: f.stack }}
                    onClick={() => updateSetting('font', f.id)}
                  >
                    <span className={styles.fontName}>{t(f.label)}</span>
                    <span className={styles.fontSample} aria-hidden="true">Cỡ chữ mẫu</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <p className={styles.formatNotice}>
            {t('Font options are fixed for this document format.')}
          </p>
        )}

        {/* 4. Font Size Slider */}
        {isReflowable && (
          <section className={styles.section}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>{t('Font size')}</span>
              <span className={styles.sliderValue}>{settings.fontSize || 18} pt</span>
            </div>
            <div className={styles.sliderWrapper}>
              <span className={styles.sliderIconSmall} aria-hidden="true">A</span>
              <Slider
                aria-label={t('Font size')}
                minValue={14}
                maxValue={28}
                step={1}
                value={settings.fontSize || 18}
                onChange={val => updateSetting('fontSize', val)}
              />
              <span className={styles.sliderIconLarge} aria-hidden="true">A</span>
            </div>
          </section>
        )}

        {/* 5. Line Height Slider */}
        {isReflowable && (
          <section className={styles.section}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>{t('Line height')}</span>
              <span className={styles.sliderValue}>{Number(settings.lineHeight || 1.6).toFixed(1)}</span>
            </div>
            <Slider
              aria-label={t('Line height')}
              minValue={1.2}
              maxValue={2.4}
              step={0.1}
              value={settings.lineHeight || 1.6}
              onChange={val => updateSetting('lineHeight', val)}
            />
          </section>
        )}

        {/* 6. Margins Slider */}
        {isReflowable && (
          <section className={styles.section}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>{t('Margins')}</span>
              <span className={styles.sliderValue}>{settings.marginWidth || 16} px</span>
            </div>
            <Slider
              aria-label={t('Margins')}
              minValue={8}
              maxValue={48}
              step={4}
              value={settings.marginWidth || 16}
              onChange={val => updateSetting('marginWidth', val)}
            />
          </section>
        )}

        {/* 7. Subtle Footer Toggle */}
        <section className={styles.sectionRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>{t('Show footer in reading mode')}</span>
            <span className={styles.toggleDesc}>{t('Displays chapter title and percentage when controls are hidden')}</span>
          </div>
          <Switch
            aria-label={t('Show footer in reading mode')}
            isSelected={settings.showMiniFooter !== false}
            onChange={val => updateSetting('showMiniFooter', val)}
          />
        </section>
      </div>
    </ReaderSheet>
  );
}
