import {useEffect, useRef} from 'react';
import {JspsychBrain, BRAIN_GRAPH} from '@jspsych/docusaurus-theme/components';
import styles from './styles.module.css';

/**
 * The dot-brain as a large, edge-cropped background watermark for the homepage
 * hero. Unlike the navbar mark (which fires its one baked chain on hover), this
 * one fires on a timer: every few seconds a RANDOM seed dot ignites and the
 * activation propagates outward through BRAIN_GRAPH — a different chain from a
 * different origin each pulse. Pure DOM/CSS; the flash itself is the shared
 * synapseFire keyframe, triggered by the data-fire attribute.
 *
 * Quiet by default: paused when the hero scrolls off-screen or the tab is
 * hidden, and disabled entirely under prefers-reduced-motion.
 */

const {nodes, adj, window: WINDOW, dropBase: DROP_BASE, dropSlope: DROP_SLOPE} =
  BRAIN_GRAPH;
const N = nodes.length;

const dist = (i: number, j: number) =>
  Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);

/** Dijkstra from `seed` over randomised edge latencies → per-dot fire schedule.
 *  Mirrors scripts/gen-brain.mjs so the runtime cascade matches the baked one. */
function schedule(seed: number) {
  const arrive = new Array(N).fill(Infinity);
  const settled = new Array(N).fill(false);
  arrive[seed] = 0;
  for (let n = 0; n < N; n++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < N; i++)
      if (!settled[i] && arrive[i] < best) {
        best = arrive[i];
        u = i;
      }
    if (u === -1) break;
    settled[u] = true;
    for (const v of adj[u]) {
      const w = dist(u, v) * (0.5 + 0.9 * Math.random());
      if (arrive[u] + w < arrive[v]) arrive[v] = arrive[u] + w;
    }
  }

  const finite = arrive.filter((x) => isFinite(x));
  const aMax = Math.max(...finite) || 1;
  return nodes.map((_, i) => {
    if (!isFinite(arrive[i])) return null;
    const nt = arrive[i] / aMax; // 0 (first) … 1 (last)
    const fires =
      i === seed || Math.random() > DROP_BASE + DROP_SLOPE * nt;
    if (!fires) return null;
    return {
      delay: Math.max(0, Math.round(nt * WINDOW + (Math.random() - 0.5) * 28)),
      scale: +(1.22 + 0.36 * Math.random()).toFixed(3),
      dur: Math.round(380 + 220 * Math.random()),
    };
  });
}

export default function HeroBrain(): React.ReactElement {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrap.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const paths: SVGPathElement[] = [];
    root.querySelectorAll<SVGPathElement>('path[data-i]').forEach((p) => {
      paths[Number(p.dataset.i)] = p;
    });

    let onScreen = true;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const pulse = () => {
      // Reset the previous chain, force a reflow so the animation can restart,
      // then ignite a fresh one from a random seed.
      for (const p of paths) p.dataset.fire = '0';
      void root.offsetWidth;

      const sched = schedule(Math.floor(Math.random() * N));
      sched.forEach((s, i) => {
        const p = paths[i];
        if (!p || !s) return;
        p.style.setProperty('--fd', `${s.delay}ms`);
        p.style.setProperty('--fs', `${s.scale}`);
        p.style.setProperty('--fdur', `${s.dur}ms`);
        p.dataset.fire = '1';
      });

      schedule_next();
    };

    const schedule_next = () => {
      // Irregular cadence (≈4.5–8s) reads as organic, not metronomic.
      pending = setTimeout(() => {
        if (onScreen && document.visibilityState === 'visible') pulse();
        else schedule_next();
      }, 4500 + Math.random() * 3500);
    };

    // Only animate while the hero is actually in view.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      {threshold: 0.05},
    );
    io.observe(root);

    // First pulse shortly after load, then self-scheduling.
    pending = setTimeout(pulse, 1400);

    return () => {
      if (pending) clearTimeout(pending);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className={styles.bg} aria-hidden="true">
      <JspsychBrain className={styles.brain} aria-label={undefined} role="presentation" />
    </div>
  );
}
