import { Component } from 'react';

export default class ReaderErrorBoundary extends Component {
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
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ minHeight: '100%', padding: 24, background: '#fff', color: '#1f1f1f' }}>
        <h1>This document could not be opened</h1>
        <p>{this.state.error.message || 'The file may be damaged or use an unsupported feature.'}</p>
        <button className="btn-primary" onClick={this.props.onClose}>Return to library</button>
      </main>
    );
  }
}
