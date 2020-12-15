import {
  Teleport,
  Transition,
  defineComponent,
  inject,
  onUnmounted,
  provide,
  ref,
  renderSlot,
  toRef,
  watch,
} from 'vue';
import { GlobalPositionStrategy, PositionStrategy } from './position';
import { watchRef } from '../hook';
import { usePlatform } from '../platform';
import './overlay.scss';

/**
 * @description
 * overlay config.
 * 
 * @date 2020-09-14
 * @export
 * @interface OverlayConfig
 */
export interface OverlayConfig {
  readonly strategy: PositionStrategy;
  readonly hasBackdrop?: boolean;
  readonly backdropClose?: boolean;
  readonly backdropClick?: (() => void) | null;
  readonly backgroundBlock?: boolean;
  readonly backgroundClass?: string | string[];
  readonly backgroundColor?: string;
}


export const provideStrategy = (strategy: PositionStrategy) => {
  provide('cdk-overlay-strategy', strategy);
};

/**
 * @description
 * The content renderer.
 * 
 * @class Overlay
 */
export const Overlay = defineComponent({
  name: 'cdk-overlay',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    backgroundClass: {
      type: String,
      default: 'cdk-overlay-container__background'
    },
    hasBackdrop: {
      type: Boolean,
      default: true,
    },
    backdropClose: {
      type: Boolean,
      default: true,
    },
    backgroundBlock: Boolean,
    backdropClick: Function,
    panelClass: String,
  },
  emits: [
    'update:visible'
  ],
  setup(props, ctx) {


    const visible = watchRef(
      toRef(props, 'visible'),
      (value) => ctx.emit('update:visible', value)
    );

    const clickBackground = (event: Event) => {
      event.preventDefault();

      props.backdropClick?.();
      if (props.backdropClose) {
        visible.value = false;
      }
    };

    const panelRef = ref<HTMLElement | null>(null);
    const strategy = inject('cdk-overlay-strategy', new GlobalPositionStrategy());
    const overlayProps = strategy.setup(panelRef, visible);
    const positionedStyle = watchRef(overlayProps.positionedStyle);
    const containerStyle = ref(overlayProps.containerStyle);

    const body = usePlatform().BODY;
    if (body) {
      const originOverflow = body.style.overflow;
      watch(visible, (value) => {
        if (props.backgroundBlock) {
          body.style.overflow = value ? 'hidden' : originOverflow;
        }
      });
      onUnmounted(() => {
        body.style.overflow = originOverflow;
      });
    }

    return () => (
      <Teleport to="#cdk-overlay-anchor">
        <Transition name="cdk-overlay-fade">
          <div
            v-show={visible.value}
            class={[
              'cdk-overlay-container',
              {
                [props.backgroundClass]: props.hasBackdrop,
                'cdk-overlay-container__disabled': !props.hasBackdrop
              }
            ]}
          >
            <div
              class={['cdk-overlay-panel', !props.hasBackdrop ? 'cdk-overlay-container__disabled' : '']}
              style={containerStyle.value}
              onClick={clickBackground}
            >
              <div
                ref={panelRef}
                class="cdk-overlay"
                style={positionedStyle.value}
                onClick={event => event.cancelBubble = true}
              >
                {renderSlot(ctx.slots, 'default')}
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    );
  }
});
