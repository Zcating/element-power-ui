import { ref, watch } from 'vue';
import { runWhileResize } from '../tools';
import Platform from './platform';

/**
 * current viewport rect & size
 *
 * @export
 * @class ViewPort
 */
export default class ViewPort {
  size = ref({ width: 0, height: 0 });
  rect = ref({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 });
  isBrowser: boolean;

  /**
   * update viewport size
   *
   * @memberof ViewPort
   */
  updateSize = () => {
    this.size.value = this.isBrowser
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 0, height: 0 };
  };

  constructor(private platform: Platform) {
    this.isBrowser = platform.BROWSER;
  }

  observe() {
    if (!this.isBrowser) return;
    runWhileResize(this.updateSize);
    const body = document.documentElement || document.body;
    watch(
      this.size,
      (res) => {
        const rect = body.getBoundingClientRect();
        const top = -rect.top || body.scrollTop || window.scrollY;
        const left = -rect.left || body.scrollLeft || window.scrollX;
        const { width, height } = res;
        this.rect.value = {
          top,
          left,
          bottom: top + height,
          right: left + width,
          width,
          height,
        };
      },
      { immediate: true }
    );
  }
}
