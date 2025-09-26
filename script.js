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
const deleteAllBtn = document.querySelector('.delete-all-btn');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #editingId = null; // Track which workout is being edited
  #markers = new Map();
  #sortField = null; // e.g 'distance'
  #sortDirection = 'desc'; // 'asc' or 'desc'

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
    deleteAllBtn.addEventListener('click', this._deleteAllWorkouts.bind(this));
    document
      .querySelector('.sort-controls')
      .addEventListener('click', this._handleSort.bind(this));
  }

  // ===== MODAL UTILITY METHODS =====
  _showModal(
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm
  ) {
    const overlay = document.querySelector('.modal-overlay');
    const titleEl = overlay.querySelector('.modal__title');
    const contentEl = overlay.querySelector('.modal__content');
    const confirmBtn = overlay.querySelector('.modal__btn--confirm');
    const cancelBtn = overlay.querySelector('.modal__btn--cancel');
    const closeBtn = overlay.querySelector('.modal__close');

    // Set content
    titleEl.textContent = title;
    contentEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // Show modal
    overlay.classList.remove('hidden');

    // Handle confirm
    const handleConfirm = () => {
      onConfirm();
      this._hideModal();
    };

    // Handle cancel/close
    const handleCancel = () => {
      this._hideModal();
    };

    // Attach listeners (remove previous to avoid duplicates)
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    closeBtn.replaceWith(closeBtn.cloneNode(true));

    overlay
      .querySelector('.modal__btn--confirm')
      .addEventListener('click', handleConfirm);
    overlay
      .querySelector('.modal__btn--cancel')
      .addEventListener('click', handleCancel);
    overlay
      .querySelector('.modal__close')
      .addEventListener('click', handleCancel);

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
        window.removeEventListener('keydown', handleEscape);
      }
    };
    window.addEventListener('keydown', handleEscape);
  }

  _hideModal() {
    document.querySelector('.modal-overlay').classList.add('hidden');
  }

  _renderWorkoutsSorted() {
    if (!this.#workouts.length) return;

    // Clone and sort
    const sortedWorkouts = [...this.#workouts].sort((a, b) => {
      let aValue, bValue;

      switch (this.#sortField) {
        case 'date':
          aValue = a.date.getTime();
          bValue = b.date.getTime();
          break;
        case 'distance':
          aValue = a.distance;
          bValue = b.distance;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'value':
          // For consistent "higher is better":
          // - Running: use -pace (so lower pace = higher value)
          // - Cycling: use speed
          aValue = a.type === 'running' ? -a.pace : a.speed;
          bValue = b.type === 'running' ? -b.pace : b.speed;
          break;
        default:
          return 0;
      }

      // Apply direction
      const direction = this.#sortDirection === 'asc' ? 1 : -1;
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

    // Clear current list (keep form and delete-all)
    document.querySelectorAll('.workout').forEach((el) => el.remove());

    // Re-render in sorted order
    sortedWorkouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }

  _handleSort(e) {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;

    const sortField = btn.dataset.sort;

    // Toggle direction if same field, else reset to desc
    if (this.#sortField === sortField) {
      this.#sortDirection = this.#sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.#sortField = sortField;
      this.#sortDirection = 'desc'; // Default: highest first
    }

    // Update active button UI
    document
      .querySelectorAll('.sort-btn')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Update button text to show direction (optional but helpful)
    const directionSymbol = this.#sortDirection === 'asc' ? ' ↑' : ' ↓';
    // btn.innerHTML = btn.innerHTML.replace(/ [↑↓]$/, '') + directionSymbol;
    // Remove any existing direction symbols
    btn.innerHTML = btn.innerHTML.replace(/[↑↓]/g, '').trim();
    // Add the new direction symbol
    btn.innerHTML += directionSymbol;

    // Re-render list
    this._renderWorkoutsSorted();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        this._showModal(
          'Location Access Denied',
          'Could not get your position. Please enable location services and refresh the page.',
          'OK',
          null,
          () => {}
        );
      });
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
            this._showModal(
              'Invalid Input',
              'All inputs must be positive numbers.',
              'OK',
              null,
              () => {} // No-op confirm
            );
            return;
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
            this._showModal(
              'Invalid Input',
              'All inputs must be positive numbers.',
              'OK',
              null,
              () => {} // No-op confirm
            );
            return;
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
        this._showModal(
          'Invalid Input',
          'All inputs must be positive numbers.',
          'OK',
          null,
          () => {} // No-op confirm
        );
        return;
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
        this._showModal(
          'Invalid Input',
          'All inputs must be positive numbers.',
          'OK',
          null,
          () => {} // No-op confirm
        );
        return;
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    if (this.#sortField) {
      this._renderWorkoutsSorted();
    } else {
      this._renderWorkout(workout);
    }

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
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

    this.#markers.set(workout.id, marker);
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
        <button class="workout__delete-btn">🗑 Delete</button>
      </div>
    </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  // Update _updateWorkout to only update the specific marker
  _updateWorkout(index) {
    const workout = this.#workouts[index];

    // Update DOM element
    if (this.#sortField) {
      this._renderWorkoutsSorted();
    } else {
      const oldEl = document.querySelector(`.workout[data-id="${workout.id}"]`);
      if (oldEl) oldEl.remove();
      this._renderWorkout(workout);
    }

    // Update ONLY the specific marker
    const marker = this.#markers.get(workout.id);
    if (marker) {
      marker.setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      );

      // If type changed, update the popup class
      const popup = marker.getPopup();
      popup.getElement().className = `leaflet-popup ${workout.type}-popup`;
    }
  }

  _handleWorkoutClick(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workoutId = workoutEl.dataset.id;

    // Handle Edit
    if (e.target.closest('.workout__edit-btn')) {
      this._editWorkout(workoutId);
      return;
    }

    // Handle Delete
    if (e.target.closest('.workout__delete-btn')) {
      this._deleteWorkout(workoutId);
      return;
    }

    // Handle map pan (default click on workout)
    if (!this.#map) return;
    const workout = this.#workouts.find((work) => work.id === workoutId);
    if (!workout) return;

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
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

  _deleteWorkout(id) {
    // 1. Remove from array
    const index = this.#workouts.findIndex((work) => work.id === id);
    if (index === -1) return;

    this.#workouts.splice(index, 1);

    // 2. Remove from DOM
    const workoutEl = document.querySelector(`.workout[data-id="${id}"]`);
    if (workoutEl) workoutEl.remove();

    // 3. Remove marker from map
    const marker = this.#markers.get(id);
    if (marker) {
      this.#map.removeLayer(marker);
      this.#markers.delete(id);
    }

    // 4. Update localStorage
    this._setLocalStorage();

    // Optional: if currently editing this workout, reset edit state
    if (this.#editingId === id) {
      this.#editingId = null;
    }

    if (this.#sortField && this.#workouts.length > 0) {
      this._renderWorkoutsSorted();
    }
  }

  _deleteAllWorkouts() {
    if (this.#workouts.length === 0) return;

    // Optional: add confirmation (recommended for safety)
    this._showModal(
      'Delete All Workouts?',
      'This will permanently delete all your workouts. This action cannot be undone.',
      'Delete All',
      'Cancel',
      () => {
        // 1. Remove all markers from the map
        this.#markers.forEach((marker) => {
          this.#map.removeLayer(marker);
        });

        // 2. Clear the markers Map
        this.#markers.clear();

        // 3. Clear workouts array
        this.#workouts = [];

        // 4. Remove all workout elements from DOM
        document.querySelectorAll('.workout').forEach((el) => el.remove());

        // 5. Reset editing state
        this.#editingId = null;

        // 6. Update localStorage
        this._setLocalStorage();

        // Optional: hide form if visible
        if (!form.classList.contains('hidden')) {
          this._hideForm();
        }

        if (this.#sortField && this.#workouts.length > 0) {
          this._renderWorkoutsSorted();
        }
      }
    );
    return;
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

    if (this.#workouts.length > 0) {
      this.#sortField = 'date';
      this.#sortDirection = 'desc';
      const dateSortBtn = document.querySelector('.sort-btn[data-sort="date"]');
      if (dateSortBtn) {
        dateSortBtn.classList.add('active');
        dateSortBtn.innerHTML += ' ↓';
      }
      this._renderWorkoutsSorted();
    }
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
