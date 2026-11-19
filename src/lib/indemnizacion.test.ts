import { describe, expect, it } from 'vitest';
import { calcularIndemnizacion, mesesTrabajados, parsearFecha, type Fecha } from './indemnizacion';

const f = (s: string): Fecha => {
  const fecha = parsearFecha(s);
  if (!fecha) throw new Error(`Fecha inválida en el test: ${s}`);
  return fecha;
};

describe('parsearFecha', () => {
  it('acepta fechas válidas', () => {
    expect(parsearFecha('2024-02-29')).toEqual({ anio: 2024, mes: 2, dia: 29 });
  });
  it('rechaza fechas inexistentes o mal formadas', () => {
    expect(parsearFecha('2023-02-29')).toBeNull();
    expect(parsearFecha('2023-13-01')).toBeNull();
    expect(parsearFecha('')).toBeNull();
    expect(parsearFecha('01/02/2023')).toBeNull();
  });
});

describe('mesesTrabajados (el mes incompleto cuenta como entero)', () => {
  it.each([
    ['2024-01-01', '2024-01-01', 1],
    ['2024-01-01', '2024-01-31', 1],
    ['2024-01-01', '2024-02-01', 2],
    ['2024-01-15', '2024-03-14', 2],
    ['2024-01-15', '2024-03-15', 3],
    ['2024-01-31', '2024-03-15', 2],
    ['2024-01-31', '2024-02-29', 1],
    ['2020-01-01', '2024-12-31', 60],
  ])('%s → %s = %i meses', (inicio, fin, esperado) => {
    expect(mesesTrabajados(f(inicio), f(fin))).toBe(esperado);
  });
});

describe('calcularIndemnizacion', () => {
  it('objetivo: 20 días por año', () => {
    // 5 años = 60 meses → 100 días de salario
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('2020-01-01'), fin: f('2024-12-31'), tipo: 'objetivo' });
    expect(r.mesesTotales).toBe(60);
    expect(r.indemnizacion).toBeCloseTo(100 * 100, 6);
    expect(r.topeAplicado).toBe(false);
  });

  it('objetivo: aplica el tope de 12 mensualidades', () => {
    const r = calcularIndemnizacion({ salarioAnual: 24000, inicio: f('1990-01-01'), fin: f('2024-12-31'), tipo: 'objetivo' });
    expect(r.topeAplicado).toBe(true);
    expect(r.indemnizacion).toBeCloseTo(24000, 6);
  });

  it('improcedente posterior a 2012: 33 días por año', () => {
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('2015-01-01'), fin: f('2024-12-31'), tipo: 'improcedente' });
    expect(r.tramos).toHaveLength(1);
    expect(r.indemnizacion).toBeCloseTo(330 * 100, 6);
  });

  it('improcedente posterior a 2012: tope de 24 mensualidades', () => {
    const r = calcularIndemnizacion({ salarioAnual: 24000, inicio: f('2012-03-01'), fin: f('2060-01-01'), tipo: 'improcedente' });
    expect(r.topeAplicado).toBe(true);
    expect(r.indemnizacion).toBeCloseTo(48000, 6);
  });

  it('improcedente anterior a 2012: 45 días hasta 11/02/2012 y 33 días después', () => {
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('2010-02-12'), fin: f('2014-02-11'), tipo: 'improcedente' });
    expect(r.tramos.map((t) => [t.meses, t.diasPorAnio])).toEqual([
      [24, 45],
      [24, 33],
    ]);
    expect(r.indemnizacion).toBeCloseTo((90 + 66) * 100, 6);
  });

  it('improcedente anterior a 2012 con fin antes de 2012: solo tramo de 45 días', () => {
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('2008-01-01'), fin: f('2011-12-31'), tipo: 'improcedente' });
    expect(r.tramos).toHaveLength(1);
    expect(r.indemnizacion).toBeCloseTo(180 * 100, 6);
  });

  it('improcedente anterior a 2012: el tramo antiguo supera 24 mensualidades → se respeta, máx. 42', () => {
    // 1990-02-12 → 2012-02-11 = 22 años = 990 días de salario (> 720)
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('1990-02-12'), fin: f('2020-01-01'), tipo: 'improcedente' });
    expect(r.topeAplicado).toBe(true);
    expect(r.indemnizacion).toBeCloseTo(990 * 100, 6);
  });

  it('improcedente anterior a 2012: nunca más de 42 mensualidades', () => {
    const r = calcularIndemnizacion({ salarioAnual: 24000, inicio: f('1970-01-01'), fin: f('2020-01-01'), tipo: 'improcedente' });
    expect(r.topeMensualidades).toBe(42);
    expect(r.indemnizacion).toBeCloseTo(2000 * 42, 6);
  });

  it('objetivo ignora la regla de 2012', () => {
    const r = calcularIndemnizacion({ salarioAnual: 36500, inicio: f('2010-02-12'), fin: f('2014-02-11'), tipo: 'objetivo' });
    expect(r.tramos).toHaveLength(1);
    expect(r.indemnizacion).toBeCloseTo(80 * 100, 6);
  });

  describe('despido colectivo (ERE) con condiciones pactadas', () => {
    const base = { salarioAnual: 36500, inicio: f('2015-01-01'), fin: f('2024-12-31'), tipo: 'colectivo' as const };

    it('sin pacto aplica el mínimo legal (20 días, tope 12)', () => {
      const r = calcularIndemnizacion(base);
      expect(r.indemnizacion).toBeCloseTo(200 * 100, 6);
      expect(r.topeMensualidades).toBe(12);
    });

    it('usa los días pactados', () => {
      // 10 años × 40 días = 400 días de salario
      const r = calcularIndemnizacion({ ...base, pactado: { diasPorAnio: 40, topeMensualidades: 24 } });
      expect(r.tramos[0]?.diasPorAnio).toBe(40);
      expect(r.indemnizacion).toBeCloseTo(400 * 100, 6);
      expect(r.topeAplicado).toBe(false);
    });

    it('aplica el tope pactado', () => {
      const r = calcularIndemnizacion({ ...base, pactado: { diasPorAnio: 45, topeMensualidades: 12 } });
      expect(r.topeAplicado).toBe(true);
      expect(r.indemnizacion).toBeCloseTo(36500, 6);
    });

    it('permite pactar sin tope', () => {
      const r = calcularIndemnizacion({ ...base, inicio: f('1980-01-01'), pactado: { diasPorAnio: 45, topeMensualidades: null } });
      expect(r.topeAplicado).toBe(false);
      expect(r.indemnizacion).toBeCloseTo(45 * 45 * 100, 6);
    });

    it('admite días con decimales', () => {
      const r = calcularIndemnizacion({ ...base, pactado: { diasPorAnio: 22.5, topeMensualidades: null } });
      expect(r.indemnizacion).toBeCloseTo(225 * 100, 6);
    });

    it('usa un solo tramo aunque el contrato sea anterior a 2012', () => {
      const r = calcularIndemnizacion({ ...base, inicio: f('2010-02-12'), fin: f('2014-02-11'), pactado: { diasPorAnio: 30, topeMensualidades: null } });
      expect(r.tramos).toHaveLength(1);
    });

    it('rechaza condiciones por debajo del mínimo legal', () => {
      expect(() => calcularIndemnizacion({ ...base, pactado: { diasPorAnio: 19, topeMensualidades: 12 } })).toThrow(RangeError);
      expect(() => calcularIndemnizacion({ ...base, pactado: { diasPorAnio: 30, topeMensualidades: 10 } })).toThrow(RangeError);
    });
  });

  it('valida los datos de entrada', () => {
    expect(() => calcularIndemnizacion({ salarioAnual: 0, inicio: f('2020-01-01'), fin: f('2021-01-01'), tipo: 'objetivo' })).toThrow();
    expect(() => calcularIndemnizacion({ salarioAnual: 1000, inicio: f('2021-01-01'), fin: f('2020-01-01'), tipo: 'objetivo' })).toThrow();
  });
});
