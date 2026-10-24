import { APP_THEMES, READER_FONTS } from '../../styles/designTokens';
import Sheet from '../UI/Sheet';
import { Choice, Range } from '../UI/Controls';
export default function ReaderSettingsPanel({ settings, updateSetting, onClose }) {
  return <Sheet title="Reading settings" onClose={onClose}><div className="field-grid">
    <Choice label="Reader theme" value={settings.theme} options={APP_THEMES} onChange={value => updateSetting('theme', value)} />
    <Choice label="Reader font" value={settings.font} options={READER_FONTS} onChange={value => updateSetting('font', value)} />
    <Range label="Font size" min={14} max={28} value={settings.fontSize} onChange={value => updateSetting('fontSize', value)} />
    <Range label="Line height" min={1.2} max={2.4} step={0.05} value={settings.lineHeight} onChange={value => updateSetting('lineHeight', value)} />
    <Range label="Margins" min={8} max={48} step={2} value={settings.marginWidth} onChange={value => updateSetting('marginWidth', value)} />
    <Choice label="Reading mode" value={settings.readingMode} options={[{ id: 'scroll', label: 'Scroll' }, { id: 'classic', label: 'Pages' }]} onChange={value => updateSetting('readingMode', value)} />
    <Choice label="Status line" value={settings.readingStatusLine} options={[{ id: 'off', label: 'Off' }, { id: 'minimal', label: 'Minimal' }, { id: 'detailed', label: 'Detailed' }]} onChange={value => updateSetting('readingStatusLine', value)} />
  </div></Sheet>;
}
