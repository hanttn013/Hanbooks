import DefaultViewManagerModule from 'epubjs/lib/managers/default';
const DefaultViewManager = DefaultViewManagerModule.default || DefaultViewManagerModule;

// The component owns destruction. epub.js's anonymous window unload handler
// cannot be removed, and Stage.destroy uses the wrong orientation event case.
export default class ManagedEpubView extends DefaultViewManager {
  addEventListeners() {
    const scroller = this.settings.fullsize ? window : this.container;
    this._onScroll = this.onScroll.bind(this);
    scroller.addEventListener('scroll', this._onScroll);
  }

  destroy() {
    if (this.stage?.orientationChangeFunc) {
      window.removeEventListener('orientationchange', this.stage.orientationChangeFunc);
    }
    super.destroy();
  }
}
