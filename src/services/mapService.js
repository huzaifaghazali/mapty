import { Running } from '../models/Running.js';
import { Cycling } from '../models/Cycling.js';

export function createWorkout(formType, coords, formValues) {
  const distance = +formValues.distance;
  const duration = +formValues.duration;

  const validInputs = (...inputs) =>
    inputs.every((inp) => Number.isFinite(inp));
  const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

  let workout;
  if (formType === 'running') {
    const cadence = +formValues.cadence;
    if (
      !validInputs(distance, duration, cadence) ||
      !allPositive(distance, duration, cadence)
    )
      throw new Error('Inputs have to be positive numbers!');
    workout = new Running(coords, distance, duration, cadence);
  } else {
    const elevation = +formValues.elevation;
    if (
      !validInputs(distance, duration, elevation) ||
      !allPositive(distance, duration, elevation)
    )
      throw new Error('Inputs have to be positive numbers!');
    workout = new Cycling(coords, distance, duration, elevation);
  }

  return workout;
}

export function rehydrateWorkouts(data) {
  return data.map((obj) => {
    if (obj.type === 'running') {
      const r = new Running(
        obj.coords,
        obj.distance,
        obj.duration,
        obj.cadence
      );
      r.id = obj.id;
      r.date = new Date(obj.date);
      r.clicks = obj.clicks || 0;
      return r;
    }
    if (obj.type === 'cycling') {
      const c = new Cycling(
        obj.coords,
        obj.distance,
        obj.duration,
        obj.elevationGain
      );
      c.id = obj.id;
      c.date = new Date(obj.date);
      c.clicks = obj.clicks || 0;
      return c;
    }
    return obj;
  });
}
