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

/* Workout classes */
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

/* UI components */
function Sidebar({ children }) {
  return (
    <aside className='flex-[0_0_50rem] bg-dark1 px-[5rem] py-[3rem] pb-[4rem] flex flex-col'>
      {children}
    </aside>
  );
}

function Logo() {
  return (
    <img
      src='/logo.png'
      alt='Mapty logo'
      className='h-[5.2rem] self-center mb-[4rem]'
    />
  );
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
      className={`bg-dark2 rounded-[5px] px-[2.75rem] py-[1.5rem] mb-[1.75rem] grid grid-cols-2 gap-x-[2.5rem] gap-y-[0.5rem] transition-all duration-500 ${
        visible ? 'h-[9.25rem] opacity-100' : 'form-hidden'
      }`}
      onSubmit={onSubmit}
      aria-hidden={!visible}
    >
      <div className='flex items-baseline'>
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='type'
        >
          Type
        </label>
        <select
          id='type'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          value={type}
          onChange={onTypeChange}
        >
          <option value='running'>Running</option>
          <option value='cycling'>Cycling</option>
        </select>
      </div>

      <div className='flex items-baseline'>
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='distance'
        >
          Distance
        </label>
        <input
          id='distance'
          name='distance'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          placeholder='km'
          value={values.distance}
          onChange={(e) =>
            setValues((v) => ({ ...v, distance: e.target.value }))
          }
          inputMode='decimal'
        />
      </div>

      <div className='flex items-baseline'>
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='duration'
        >
          Duration
        </label>
        <input
          id='duration'
          name='duration'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          placeholder='min'
          value={values.duration}
          onChange={(e) =>
            setValues((v) => ({ ...v, duration: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <div
        className={`flex items-baseline ${type === 'running' ? '' : 'hidden'}`}
      >
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='cadence'
        >
          Cadence
        </label>
        <input
          id='cadence'
          name='cadence'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          placeholder='step/min'
          value={values.cadence}
          onChange={(e) =>
            setValues((v) => ({ ...v, cadence: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <div
        className={`flex items-baseline ${type === 'cycling' ? '' : 'hidden'}`}
      >
        <label
          className='flex-[0_0_50%] text-[1.5rem] font-semibold'
          htmlFor='elevation'
        >
          Elev Gain
        </label>
        <input
          id='elevation'
          name='elevation'
          className='w-full px-[1.1rem] py-[0.3rem] text-[1.4rem] text-black border-none rounded-[3px] bg-light3 transition-all duration-200 focus:outline-none focus:bg-white'
          placeholder='meters'
          value={values.elevation}
          onChange={(e) =>
            setValues((v) => ({ ...v, elevation: e.target.value }))
          }
          inputMode='numeric'
        />
      </div>

      <button className='hidden' type='submit'>
        OK
      </button>
    </form>
  );
}

function WorkoutsList({ workouts }) {
  return (
    <ul
      className='list-none h-[77vh] overflow-y-scroll overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:w-0'
      aria-label='List of workouts'
    >
      {workouts.map((w) => (
        <li
          key={w.id}
          data-id={w.id}
          className={`workout bg-dark2 rounded-[5px] px-[2.25rem] py-[1.5rem] mb-[1.75rem] cursor-pointer grid grid-cols-4 gap-x-[1.5rem] gap-y-[0.75rem] transition-all duration-200 hover:bg-opacity-80 ${
            w.type === 'running'
              ? 'border-l-[5px] border-l-brand2'
              : 'border-l-[5px] border-l-brand1'
          }`}
          tabIndex={0}
          role='button'
        >
          <h2 className='text-[1.7rem] font-semibold col-span-4'>
            {w.description}
          </h2>
          <div className='flex items-baseline'>
            <span className='text-[1.8rem] mr-[0.2rem]'>
              {w.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
            </span>
            <span className='text-[1.5rem] mr-[0.5rem]'>{w.distance}</span>
            <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
              km
            </span>
          </div>
          <div className='flex items-baseline'>
            <span className='text-[1.8rem] mr-[0.2rem]'>⏱</span>
            <span className='text-[1.5rem] mr-[0.5rem]'>{w.duration}</span>
            <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
              min
            </span>
          </div>
          {w.type === 'running' ? (
            <>
              <div className='flex items-baseline'>
                <span className='text-[1.8rem] mr-[0.2rem]'>⚡️</span>
                <span className='text-[1.5rem] mr-[0.5rem]'>
                  {w.pace ? w.pace.toFixed(1) : '-'}
                </span>
                <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
                  min/km
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='text-[1.8rem] mx-[0.5rem]'>🦶🏼</span>
                <span className='text-[1.5rem] mr-[0.5rem]'>{w.cadence}</span>
                <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
                  spm
                </span>
              </div>
            </>
          ) : (
            <>
              <div className='flex items-baseline'>
                <span className='text-[1.8rem] mr-[0.2rem]'>⚡️</span>
                <span className='text-[1.5rem] mr-[0.5rem]'>
                  {w.speed ? w.speed.toFixed(1) : '-'}
                </span>
                <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
                  km/h
                </span>
              </div>
              <div className='flex items-baseline'>
                <span className='text-[1.8rem] mx-[0.5rem]'>⛰</span>
                <span className='text-[1.5rem] mr-[0.5rem]'>
                  {w.elevationGain}
                </span>
                <span className='text-[1.1rem] text-light1 uppercase font-extrabold'>
                  m
                </span>
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

    if (mapInstance.current) {
      mapInstance.current.setView(coords, 13);
      return;
    }

    mapInstance.current = L.map(mapRef.current).setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current);

    const doInvalidate = () => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    };
    doInvalidate();
    setTimeout(doInvalidate, 100);
    setTimeout(doInvalidate, 500);

    mapInstance.current.on('click', (mapE) => {
      mapEvent.current = mapE;
      setFormVisible(true);
    });

    setMapInitialized(true);
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

  useEffect(() => {
    if (!mapInitialized || !mapInstance.current) return;
    markersRef.current.forEach((m) => {
      try {
        mapInstance.current.removeLayer(m);
      } catch (e) {}
    });
    markersRef.current = [];
    workouts.forEach((w) => _renderWorkoutMarker(w));
  }, [workouts, mapInitialized]);

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
    <div className='flex h-[95vh]'>
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
        <p className='mt-auto text-[1.3rem] text-center text-light1'>
          &copy; Copyright by{' '}
          <a
            className='text-light1 transition-all duration-200 hover:text-[#ececec]'
            href='https://github.com/huzaifaghazali'
            target='_blank'
            rel='noopener noreferrer'
          >
            Huzaifa Ghazali
          </a>
          . Made with love ♥️.
        </p>
      </Sidebar>

      <div id='map' ref={mapRef} className='flex-1 h-full bg-[#aaa]' />

      <style>{`
        .leaflet-popup .leaflet-popup-content-wrapper {
          background-color: #2d3439;
          color: #ececec;
          border-radius: 5px;
          padding-right: 0.6rem;
        }
        .leaflet-popup .leaflet-popup-content {
          font-size: 1.5rem;
        }
        .leaflet-popup .leaflet-popup-tip {
          background-color: #2d3439;
        }
        .running-popup .leaflet-popup-content-wrapper {
          border-left: 5px solid #00c46a;
        }
        .cycling-popup .leaflet-popup-content-wrapper {
          border-left: 5px solid #ffb545;
        }
      `}</style>
    </div>
  );
}
