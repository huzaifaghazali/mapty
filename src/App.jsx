// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix marker icon paths for bundlers (Vite/webpack)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl,
   iconUrl,
   shadowUrl,
});

import 'leaflet/dist/leaflet.css';
import './index.css';

/* Workout classes (same behavior as original) */
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/* UI components (kept classNames matching original CSS) */
function Sidebar({ children }) {
  return <aside className='sidebar'>{children}</aside>;
}
function Logo() {
  return <img src='/logo.png' alt='Mapty logo' className='logo' />;
}

function WorkoutForm({
  visible,
  type,
  onTypeChange,
  values,
  setValues,
  onSubmit,
}) {
  return (
    <form
      className={`form ${visible ? '' : 'hidden'}`}
      onSubmit={onSubmit}
      aria-hidden={!visible}
    >
      <div className='form__row'>
        <label className='form__label' htmlFor='type'>
          Type
        </label>
        <select
          id='type'
          className='form__input form__input--type'
          value={type}
          onChange={onTypeChange}
        >
          <option value='running'>Running</option>
          <option value='cycling'>Cycling</option>
        </select>
      </div>

      <div className='form__row'>
        <label className='form__label' htmlFor='distance'>
          Distance
        </label>
        <input
          id='distance'
          name='distance'
          className='form__input form__input--distance'
          placeholder='km'
          value={values.distance}
          onChange={(e) =>
            setValues((v) => ({ ...v, distance: e.target.value }))
          }
          inputMode='decimal'
        />
      </div>

      <div className='form__row'>
        <label className='form__label' htmlFor='duration'>
          Duration
        </label>
        <input
          id='duration'
          name='duration'
          className='form__input form__input--duration'
          placeholder='min'
          value={values.duration}
          onChange={(e) =>
            setValues((v) => ({ ...v, duration: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <div
        className={`form__row ${type === 'running' ? '' : 'form__row--hidden'}`}
      >
        <label className='form__label' htmlFor='cadence'>
          Cadence
        </label>
        <input
          id='cadence'
          name='cadence'
          className='form__input form__input--cadence'
          placeholder='step/min'
          value={values.cadence}
          onChange={(e) =>
            setValues((v) => ({ ...v, cadence: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <div
        className={`form__row ${type === 'cycling' ? '' : 'form__row--hidden'}`}
      >
        <label className='form__label' htmlFor='elevation'>
          Elev Gain
        </label>
        <input
          id='elevation'
          name='elevation'
          className='form__input form__input--elevation'
          placeholder='meters'
          value={values.elevation}
          onChange={(e) =>
            setValues((v) => ({ ...v, elevation: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <button className='form__btn' type='submit'>
        OK
      </button>
    </form>
  );
}

function WorkoutsList({ workouts }) {
  return (
    <ul className='workouts' aria-label='List of workouts'>
      {workouts.map((w) => (
        <li
          key={w.id}
          data-id={w.id}
          className={`workout workout--${w.type}`}
          tabIndex={0}
          role='button'
        >
          <h2 className='workout__title'>{w.description}</h2>
          <div className='workout__details'>
            <span className='workout__icon'>
              {w.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
            </span>
            <span className='workout__value'>{w.distance}</span>
            <span className='workout__unit'>km</span>
          </div>
          <div className='workout__details'>
            <span className='workout__icon'>⏱</span>
            <span className='workout__value'>{w.duration}</span>
            <span className='workout__unit'>min</span>
          </div>
          {w.type === 'running' ? (
            <>
              <div className='workout__details'>
                <span className='workout__icon'>⚡️</span>
                <span className='workout__value'>
                  {w.pace ? w.pace.toFixed(1) : '-'}
                </span>
                <span className='workout__unit'>min/km</span>
              </div>
              <div className='workout__details'>
                <span className='workout__icon'>🦶🏼</span>
                <span className='workout__value'>{w.cadence}</span>
                <span className='workout__unit'>spm</span>
              </div>
            </>
          ) : (
            <>
              <div className='workout__details'>
                <span className='workout__icon'>⚡️</span>
                <span className='workout__value'>
                  {w.speed ? w.speed.toFixed(1) : '-'}
                </span>
                <span className='workout__unit'>km/h</span>
              </div>
              <div className='workout__details'>
                <span className='workout__icon'>⛰</span>
                <span className='workout__value'>{w.elevationGain}</span>
                <span className='workout__unit'>m</span>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/* Main App */
export default function App() {
  const [workouts, setWorkouts] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('running');
  const [formValues, setFormValues] = useState({
    distance: '',
    duration: '',
    cadence: '',
    elevation: '',
  });
  const [mapInitialized, setMapInitialized] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const mapEvent = useRef(null);
  const markersRef = useRef([]);

  // Rehydrate localStorage
  useEffect(() => {
    const raw = localStorage.getItem('workouts');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const arr = data.map((obj) => {
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
      setWorkouts(arr);
    } catch (err) {
      console.error('Could not parse workouts from localStorage', err);
    }
  }, []);

  // Try geolocation then fallback
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => _loadMap(pos),
        () => {
          // fallback coords (London)
          _loadMap({ coords: { latitude: 51.505, longitude: -0.09 } });
        },
        { timeout: 10000 }
      );
    } else {
      _loadMap({ coords: { latitude: 51.505, longitude: -0.09 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    if (!mapRef.current) {
      console.error('map container ref not found');
      return;
    }

    // If map already exists, just set view
    if (mapInstance.current) {
      mapInstance.current.setView(coords, 13);
      return;
    }

    mapInstance.current = L.map(mapRef.current).setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    // Ensure proper rendering (common issue inside flex)
    const doInvalidate = () => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    };
    doInvalidate();
    setTimeout(doInvalidate, 100);
    setTimeout(doInvalidate, 500);

    // show form on map click
    mapInstance.current.on('click', (mapE) => {
      mapEvent.current = mapE;
      setFormVisible(true);
    });

    // set flag so other effects can depend on map being ready
    setMapInitialized(true);

    // add markers for any previously loaded workouts
    workouts.forEach((w) => _renderWorkoutMarker(w));
  }

  function _renderWorkoutMarker(workout) {
    if (!mapInstance.current) return;
    const marker = L.marker(workout.coords)
      .addTo(mapInstance.current)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    markersRef.current.push(marker);
  }

  // Keep markers in sync whenever workouts change (and map is ready)
  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    // remove all previous markers
    markersRef.current.forEach((m) => {
      try {
        mapInstance.current.removeLayer(m);
      } catch (e) {}
    });
    markersRef.current = [];
    workouts.forEach((w) => _renderWorkoutMarker(w));
  }, [workouts, mapInitialized]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {}
        mapInstance.current = null;
      }
    };
  }, []);

  function handleTypeChange(e) {
    setFormType(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!mapEvent.current) return;
    const { lat, lng } = mapEvent.current.latlng;

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
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    } else {
      const elevation = +formValues.elevation;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    setWorkouts((prev) => {
      const next = [...prev, workout];
      localStorage.setItem('workouts', JSON.stringify(next));
      return next;
    });

    setFormValues({ distance: '', duration: '', cadence: '', elevation: '' });
    setFormVisible(false);
  }

  // click on list -> move map
  useEffect(() => {
    function onClick(e) {
      const li = e.target.closest('.workout');
      if (!li) return;
      const id = li.dataset.id;
      const w = workouts.find((x) => x.id === id);
      if (!w || !mapInstance.current) return;
      mapInstance.current.setView(w.coords, 13, {
        animate: true,
        pan: { duration: 1 },
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [workouts]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar>
        <Logo />
        <WorkoutForm
          visible={formVisible}
          type={formType}
          onTypeChange={handleTypeChange}
          values={formValues}
          setValues={setFormValues}
          onSubmit={handleSubmit}
        />
        <WorkoutsList workouts={workouts} />
        <p className='copyright'>
          &copy; Copyright by{' '}
          <a
            className='twitter-link'
            href='https://twitter.com/jonasschmedtman'
            target='_blank'
            rel='noopener noreferrer'
          >
            Jonas Schmedtmann
          </a>
          . Use for learning or your portfolio. Don't use to teach. Don't claim
          as your own.
        </p>
      </Sidebar>

      <div id='map' ref={mapRef} style={{ flex: 1, height: '100%' }} />
    </div>
  );
}
