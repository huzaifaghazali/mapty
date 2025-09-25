'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    // min/km
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
    this.speed = this.distance / (this.duration / 60); // km/h
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #editingId = null; // Track which workout is being edited

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._handleWorkoutClick.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();

    // Show the form button when creating a new workout
    const formBtn = form.querySelector('.form__btn');
    formBtn.style.display = 'block';
    formBtn.textContent = 'OK';
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);

    // Reset editing state
    this.#editingId = null;
    const formBtn = form.querySelector('.form__btn');
    formBtn.textContent = 'OK';
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // Check if we're editing an existing workout
    if (this.#editingId) {
      const workoutIndex = this.#workouts.findIndex(
        (work) => work.id === this.#editingId
      );

      if (workoutIndex !== -1) {
        const workout = this.#workouts[workoutIndex];

        // Update basic properties
        workout.distance = distance;
        workout.duration = duration;

        // Update type-specific properties
        if (type === 'running') {
          const cadence = +inputCadence.value;

          if (
            !validInputs(distance, duration, cadence) ||
            !allPositive(distance, duration, cadence)
          ) {
            return alert('Inputs have to be positive numbers!');
          }

          // If changing type, create a new workout object
          if (workout.type !== 'running') {
            const newWorkout = new Running(
              workout.coords,
              distance,
              duration,
              cadence
            );
            newWorkout.id = workout.id; // Keep the same ID
            newWorkout.date = workout.date; // Keep the same date
            this.#workouts[workoutIndex] = newWorkout;
          } else {
            workout.cadence = cadence;
            workout.calcPace();
            workout._setDescription();
          }
        } else if (type === 'cycling') {
          const elevation = +inputElevation.value;

          if (
            !validInputs(distance, duration, elevation) ||
            !allPositive(distance, duration)
          ) {
            return alert('Inputs have to be positive numbers!');
          }

          // If changing type , create a new workout object
          if (workout.type !== 'cycling') {
            const newWorkout = new Cycling(
              workout.coords,
              distance,
              duration,
              elevation
            );
            newWorkout.id = workout.id; // Keep the same ID
            newWorkout.date = workout.date; // Keep the same date
            this.#workouts[workoutIndex] = newWorkout;
          } else {
            workout.elevationGain = elevation;
            workout.calcSpeed();
            workout._setDescription();
          }
        }

        // Update the UI
        this._updateWorkout(workoutIndex);
        this._setLocalStorage();
        this._hideForm();
        return;
      }
    }

    // If not editing, create a new workout
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
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
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      `;

    // Add edit button
    html += `
      <div class="workout__actions">
        <button class="workout__edit-btn">✏️ Edit</button>
      </div>
    </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _updateWorkout(index) {
    // Remove the old workout element from the DOM
    const oldWorkoutEl = document.querySelector(
      `.workout[data-id="${this.#workouts[index].id}"]`
    );
    if (oldWorkoutEl) oldWorkoutEl.remove();

    // Render the updated workout
    this._renderWorkout(this.#workouts[index]);

    // Update the marker on the map
    // Remove all markers and re-render them
    this.#map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.#map.removeLayer(layer);
      }
    });

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _handleWorkoutClick(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    // Check if edit button was clicked
    if (e.target.closest('.workout__edit-btn')) {
      this._editWorkout(workoutEl.dataset.id);
      return;
    }

    // Otherwise, move to popup
    if (!this.#map) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  _editWorkout(id) {
    const workout = this.#workouts.find((work) => work.id === id);
    if (!workout) return;

    // Set editing mode
    this.#editingId = id;

    // Update form button text
    const formBtn = form.querySelector('.form__btn');
    formBtn.textContent = 'Update';
    formBtn.style.display = 'block';

    // Populate form with workout data
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
      inputElevation.value = '';
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    } else if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain;
      inputCadence.value = '';
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }

    // Show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    // Restore prototype chain for each workout
    this.#workouts = data.map((work) => {
      // Convert date string back to Date object
      work.date = new Date(work.date);

      // Create a new instance of the appropriate class
      if (work.type === 'running') {
        const runningWorkout = new Running(
          work.coords,
          work.distance,
          work.duration,
          work.cadence
        );
        runningWorkout.id = work.id;
        runningWorkout.date = work.date;
        return runningWorkout;
      } else if (work.type === 'cycling') {
        const cyclingWorkout = new Cycling(
          work.coords,
          work.distance,
          work.duration,
          work.elevationGain
        );
        cyclingWorkout.id = work.id;
        cyclingWorkout.date = work.date;
        return cyclingWorkout;
      }
      return work;
    });

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
