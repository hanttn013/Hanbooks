import { Button } from '@react-spectrum/s2/Button';
import { ActionButton } from '@react-spectrum/s2/ActionButton';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { TextField } from '@react-spectrum/s2/TextField';
import { SearchField } from '@react-spectrum/s2/SearchField';
import { Slider } from '@react-spectrum/s2/Slider';
import { useI18n } from '../../i18n/context';

export function Action({ children, onPress, onClick, disabled, label, primary, negative, ...props }) {
  const Component = primary || negative ? Button : ActionButton;
  return <Component {...props} size="L" variant={negative ? 'negative' : primary ? 'accent' : undefined} isDisabled={disabled} aria-label={label} onPress={onPress || onClick}>{children}</Component>;
}
export function Choice({ label, value, onChange, options, ...props }) {
  const { t } = useI18n();
  return <Picker {...props} size="L" label={t(label)} selectedKey={value} onSelectionChange={key => onChange(String(key))}>
    {options.map(option => <PickerItem key={option.id ?? option.value} id={option.id ?? option.value}>{option.raw ? option.label : t(option.label)}</PickerItem>)}
  </Picker>;
}
export function Field({ label, ...props }) {
  const { t } = useI18n();
  return <TextField {...props} size="L" label={t(label)} />;
}
export function SearchBox({ label, ...props }) {
  const { t } = useI18n();
  return <SearchField {...props} size="L" aria-label={t(label)} placeholder={t(label)} />;
}
export function Range({ label, min, max, ...props }) {
  const { t } = useI18n();
  return <Slider {...props} label={t(label)} minValue={min} maxValue={max} />;
}
