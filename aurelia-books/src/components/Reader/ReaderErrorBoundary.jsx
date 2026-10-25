import { Component } from 'react';
import { I18nContext } from '../../i18n/context';
import { Action } from '../UI/Controls';

export default class ReaderErrorBoundary extends Component {
  static contextType = I18nContext;
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Reader failed without crashing the app:', error, info);
  }

  render() {
    const { t } = this.context;
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ minHeight: '100%', padding: 24, background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
        <h1>{t('Could not open this document')}</h1>
        <p>{this.state.error.message || t('The file may be damaged or use an unsupported feature.')}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Action primary onPress={() => this.setState({ error: null })}>{t('Retry')}</Action>
          <Action onPress={this.props.onClose}>{t('Return to library')}</Action>
        </div>
      </main>
    );
  }
}
