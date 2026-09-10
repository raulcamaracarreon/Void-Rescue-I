import { describe, expect, it } from 'vitest';
import { Simulation, IDLE_INPUT, SCENARIOS } from '../../src/game/Simulation';
import type { FlightInput, ScenarioName } from '../../src/game/Simulation';
import { COMBAT } from '../../src/game/combat/types';
import { damageEnemy, hitPlayer } from '../../src/game/combat/CombatSystem';
import { spawnEnemy } from '../../src/game/combat/EnemySystem';
import { sweptHit } from '../../src/game/combat/spatial';

function tick(s: Simulation, frames: number, input: FlightInput = IDLE_INPUT): void {
  for (let i = 0; i < frames; i++) s.update(1 / 60, input);
}
function scenario(name: ScenarioName = 'combat-basic'): Simulation { return new Simulation(8042, name); }

describe('colonos y abducción', () => {
  it('inicia ocho colonos y reservas únicas para cada Harvester', () => {
    const s = scenario();
    expect(s.state.colonists).toHaveLength(8);
    spawnEnemy(s.context, 'harvester', 400, 60, 0);
    spawnEnemy(s.context, 'harvester', 400, 60, 0);
    tick(s, 1);
    const targets = s.state.enemies.map(e => e.target);
    expect(new Set(targets).size).toBe(2);
    for (const e of s.state.enemies) expect(s.state.colonists.find(c => c.id === e.target)?.owner).toBe(e.id);
  });
  it('completa descenso, captura, elevación y mutación sin perder la reserva', () => {
    const s = scenario('abduction-start');
    tick(s, 12);
    expect(s.state.colonists[0]!.status).toBe('captured');
    tick(s, 950);
    expect(s.state.colonists[0]!.status).toBe('lost');
    expect(s.state.colonists[0]!.owner).toBeNull();
    expect(s.state.enemies[0]!.kind).toBe('wraith');
    expect(s.state.events.some(e => e.kind === 'mutation')).toBe(true);
  });
  it('libera una reserva si muere antes de capturar; puntúa una sola vez', () => {
    const s = scenario('abduction-start'), enemy = s.state.enemies[0]!;
    damageEnemy(s.context, enemy, 20); damageEnemy(s.context, enemy, 20);
    expect(s.state.colonists[0]!.status).toBe('ground');
    expect(s.state.colonists[0]!.owner).toBeNull();
    expect(s.state.score).toBe(150); expect(s.state.kills).toBe(1);
  });
  it('libera una víctima elevada al destruir al captor', () => {
    const s = scenario('abduction-start'); tick(s, 180);
    damageEnemy(s.context, s.state.enemies[0]!, 20);
    expect(s.state.colonists[0]!.status).toBe('falling');
    expect(s.state.events.at(-1)?.kind).toBe('falling');
    expect(s.state.colonists[0]!.owner).toBeNull();
    tick(s, 1); expect(s.state.outcome).toBe('active');
  });
  it('distingue aterrizaje suave y mortal', () => {
    for (const [speed, expected] of [[-2, 'ground'], [-16, 'lost']] as const) {
      const s = scenario('falling-colonist'), c = s.state.colonists[0]!;
      c.x = 700; c.y = s.context.terrain.height(c.x) + 1.55; c.vy = speed;
      tick(s, 2); expect(c.status).toBe(expected);
    }
  });
  it('atrapa, transporta, entrega y activa portal con entrada normal', () => {
    const s = scenario('falling-colonist');
    tick(s, 40, { x: 1, y: 0, fire: false });
    expect(s.state.colonists[0]!.status).toBe('carried');
    tick(s, 230, { x: 0, y: -1, fire: false });
    expect(s.state.colonists[0]!.status).toBe('safe');
    expect(s.state.delivered).toBe(1); expect(s.state.portal.ready).toBe(true);
    expect(s.state.score).toBe(COMBAT.catchPoints + COMBAT.deliveryPoints);
    tick(s, 60); expect(s.state.delivered).toBe(1);
  });
  it('la muerte del jugador libera a los transportados', () => {
    const s = scenario('falling-colonist'); tick(s, 40, { x: 1, y: 0, fire: false });
    hitPlayer(s.context);
    expect(s.state.colonists[0]!.status).toBe('falling');
  });
});

describe('combate y oleada', () => {
  it('barrido de proyectiles funciona a ambos lados de la costura', () => {
    expect(sweptHit(2395, 30, 12, 0, { x: 2, y: 30 }, 1)).not.toBeNull();
    expect(sweptHit(2, 30, -12, 0, { x: 2395, y: 30 }, 1)).not.toBeNull();
    expect(sweptHit(2395, 30, 12, 0, { x: 2, y: 40 }, 1)).toBeNull();
  });
  it('el disparo mata la última amenaza y produce un único resumen', () => {
    const s = scenario('wave-near-complete'); tick(s, 120, { x: 0, y: 0, fire: true });
    expect(s.state.outcome).toBe('victory'); expect(s.state.kills).toBe(1);
    expect(s.state.summary?.survivors).toBe(8);
    const score = s.state.score; tick(s, 300); expect(s.state.score).toBe(score);
  });
  it('la bomba consume sólo una carga al mantenerla; no mata colonos ni enemigos fuera de vista', () => {
    const s = scenario();
    spawnEnemy(s.context, 'harvester', 420, 55, 0);
    spawnEnemy(s.context, 'flux', 800, 55, 0);
    tick(s, 70, { x: 0, y: 0, fire: false, bomb: true, view: { centerX: 360, width: 200 } });
    expect(s.state.bombs).toBe(1); expect(s.state.enemies.map(e => e.kind)).toEqual(['flux']);
    expect(s.state.colonists.every(c => c.status !== 'lost')).toBe(true);
    expect(s.state.events.filter(e => e.kind === 'bomb')).toHaveLength(1);
  });
  it('la bomba respeta la costura y los enemigos aún materializándose', () => {
    const s = scenario();
    s.state.player.x = 2395;
    spawnEnemy(s.context, 'interceptor', 8, 54, 0);
    const protectedEnemy = spawnEnemy(s.context, 'flux', 15, 54, 2);
    tick(s, 20, { x: 0, y: 0, fire: false, bomb: true, view: { centerX: 2395, width: 100 } });
    expect(s.state.enemies.map(e => e.id)).toEqual([protectedEnemy.id]);
  });
  it('el portal exige rescate, cercanía y no permite omitir amenazas', () => {
    const s = scenario('portal-ready');
    tick(s, 1, { x: 0, y: 0, fire: false, portal: true });
    expect(s.state.portal.used).toBe(true); expect(s.state.score).toBe(COMBAT.portalBonus);
    expect(s.state.player.x).toBeGreaterThan(1200); expect(s.state.outcome).toBe('active');
    tick(s, 120, { x: 0, y: 0, fire: false, portal: true });
    expect(s.state.score).toBe(COMBAT.portalBonus);
    const locked = scenario(); tick(locked, 1, { x: 0, y: 0, fire: false, portal: true });
    expect(locked.state.portal.used).toBe(false);
  });
  it('no concluye antes de apariciones o mientras transporta una víctima', () => {
    const s = scenario(); tick(s, 60); expect(s.state.outcome).toBe('active');
    s.state.schedule = []; s.state.colonists[0]!.status = 'carried';
    tick(s, 1); expect(s.state.outcome).toBe('active');
  });
  it('reaparece con invulnerabilidad y la última vida causa derrota', () => {
    const s = scenario('player-near-death'); tick(s, 20);
    expect(s.state.player.alive).toBe(false); expect(s.state.lives).toBe(1);
    tick(s, 110); expect(s.state.player.alive).toBe(true); expect(s.state.player.invulnerable).toBeGreaterThan(0);
    hitPlayer(s.context); expect(s.state.lives).toBe(1);
    const last = scenario('last-life'); tick(last, 20);
    expect(last.state.outcome).toBe('defeat'); expect(last.state.summary).not.toBeNull();
  });
  it('escala refuerzos sin aparecer sobre el jugador y Flux genera drones limitados', () => {
    const s = scenario(); s.state.player.x = 400; tick(s, 130);
    expect(s.state.spawnIndex).toBe(1);
    expect(Math.abs(s.state.enemies[0]!.x - s.state.player.x)).toBeGreaterThan(50);
    const flux = spawnEnemy(s.context, 'flux', 700, 55, 0); flux.cooldown = 0;
    tick(s, 1); expect(s.state.enemies.some(e => e.kind === 'drone')).toBe(true);
  });
  it('todos los escenarios son reproducibles con la misma semilla y entradas', () => {
    for (const name of SCENARIOS) {
      const a = scenario(name), b = scenario(name);
      tick(a, 240, { x: 1, y: 0, fire: true }); tick(b, 240, { x: 1, y: 0, fire: true });
      expect(a.snapshot()).toEqual(b.snapshot());
    }
  });
});
