'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  shapeType = 'marker'; // New property: 'marker', 'polyline', 'polygon', 'rectangle', 'circle'

  constructor(coords, distance, duration, shapeType = 'marker') {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.shapeType = shapeType; // Type of shape drawn
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

  #drawControl; // Leaflet draw control
  #drawnItems; // Layer group for drawn items
  #currentDrawType = 'marker'; // Current drawing tool selected
  #currentShape; // C

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

    // NEW: Fit all workouts button
    const fitAllBtn = document.querySelector('.fit-all-btn');
    if (fitAllBtn) {
      fitAllBtn.addEventListener('click', this._fitAllWorkouts.bind(this));
      // Disable initially (will enable when workouts exist)
      fitAllBtn.disabled = true;
    }

    document
      .querySelector('.draw-controls')
      .addEventListener('click', this._handleDrawControl.bind(this));
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

    // Initialize the FeatureGroup to store editable layers
    this.#drawnItems = new L.FeatureGroup();
    this.#map.addLayer(this.#drawnItems);

    // Initialize the draw control and pass it the FeatureGroup
    this.#drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.#drawnItems,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        // We'll control which tool is active through our UI
        polyline: false,
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
      },
    });

    // Don't add the draw control to the map yet
    // We'll activate specific tools based on user selection

    // Handle map events for created shapes
    this.#map.on(L.Draw.Event.CREATED, this._shapeCreated.bind(this));
    this.#map.on(L.Draw.Event.EDITED, this._shapeEdited.bind(this));
    this.#map.on(L.Draw.Event.DELETED, this._shapeDeleted.bind(this));

    // Now that the map is loaded, render all workout shapes
    this.#workouts.forEach((work) => {
      this._renderWorkoutShape(work);
    });

    // Also render the workout list
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });

    // Set up sorting if we have workouts
    if (this.#workouts.length > 0) {
      const dateSortBtn = document.querySelector('.sort-btn[data-sort="date"]');
      if (dateSortBtn) {
        dateSortBtn.classList.add('active');
        dateSortBtn.innerHTML += ' ↓';
      }
      this._renderWorkoutsSorted();
      this._updateFitAllButton();
    }
  }

  _handleDrawControl(e) {
    const btn = e.target.closest('.draw-btn');
    if (!btn) return;

    const drawType = btn.dataset.draw;

    // Update active button UI
    document
      .querySelectorAll('.draw-btn')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Remove any existing draw control
    if (this.#drawControl) {
      this.#map.removeControl(this.#drawControl);
    }

    // Set current draw type
    this.#currentDrawType = drawType;

    // Configure the draw control based on selected type
    const drawOptions = {
      edit: {
        featureGroup: this.#drawnItems,
        remove: true,
      },
      draw: {
        polyline: drawType === 'polyline',
        polygon: drawType === 'polygon',
        rectangle: drawType === 'rectangle',
        circle: drawType === 'circle',
        marker: drawType === 'marker',
        // Disable other tools
        circlemarker: false,
      },
    };

    // Add the configured draw control
    this.#drawControl = new L.Control.Draw(drawOptions);
    this.#map.addControl(this.#drawControl);

    // Show form if not already visible
    if (form.classList.contains('hidden')) {
      form.classList.remove('hidden');
      inputDistance.focus();
    }
  }

  _shapeCreated(e) {
    const layer = e.layer;
    const type = e.layerType;

    // Add the shape to the drawn items layer
    this.#drawnItems.addLayer(layer);

    // Store the current shape
    this.#currentShape = {
      type: type,
      layer: layer,
    };

    // Extract coordinates based on shape type
    let coords;
    switch (type) {
      case 'marker':
        coords = [layer.getLatLng().lat, layer.getLatLng().lng];
        break;
      case 'polyline':
        coords = layer.getLatLngs().map((ll) => [ll.lat, ll.lng]);
        break;
      case 'polygon':
        coords = layer.getLatLngs()[0].map((ll) => [ll.lat, ll.lng]);
        break;
      case 'rectangle':
        const bounds = layer.getBounds();
        coords = [
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        ];
        break;
      case 'circle':
        coords = [layer.getLatLng().lat, layer.getLatLng().lng];
        break;
    }

    // Store the shape data for when the form is submitted
    this.#mapEvent = {
      latlng: {
        lat: coords[0][0] || coords[0],
        lng: coords[0][1] || coords[1],
      },
    };

    // Show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _shapeEdited(e) {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      // Find the corresponding workout and update it
      const workoutId = layer.options.workoutId;
      if (workoutId) {
        const workout = this.#workouts.find((w) => w.id === workoutId);
        if (workout) {
          // Update the workout coordinates based on the edited shape
          this._updateWorkoutCoords(workout, layer);
          this._setLocalStorage();
        }
      }
    });
  }

  _shapeDeleted(e) {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      // Find and remove the corresponding workout
      const workoutId = layer.options.workoutId;
      if (workoutId) {
        this._deleteWorkout(workoutId);
      }
    });
  }

  _updateWorkoutCoords(workout, layer) {
    switch (workout.shapeType) {
      case 'marker':
        workout.coords = [layer.getLatLng().lat, layer.getLatLng().lng];
        break;
      case 'polyline':
        workout.coords = layer.getLatLngs().map((ll) => [ll.lat, ll.lng]);
        break;
      case 'polygon':
        workout.coords = layer.getLatLngs()[0].map((ll) => [ll.lat, ll.lng]);
        break;
      case 'rectangle':
        const bounds = layer.getBounds();
        workout.coords = [
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        ];
        break;
      case 'circle':
        workout.coords = [layer.getLatLng().lat, layer.getLatLng().lng];
        workout.radius = layer.getRadius(); // Store radius for circles
        break;
    }
  }

  _getShapeCoords(layer, type) {
    switch (type) {
      case 'marker':
        return [layer.getLatLng().lat, layer.getLatLng().lng];
      case 'polyline':
        return layer.getLatLngs().map((ll) => [ll.lat, ll.lng]);
      case 'polygon':
        return layer.getLatLngs()[0].map((ll) => [ll.lat, ll.lng]);
      case 'rectangle':
        const bounds = layer.getBounds();
        return [
          [bounds.getSouthWest().lat, bounds.getSouthWest().lng],
          [bounds.getNorthEast().lat, bounds.getNorthEast().lng],
        ];
      case 'circle':
        return [layer.getLatLng().lat, layer.getLatLng().lng];
      default:
        return [0, 0];
    }
  }

  _fitAllWorkouts() {
    if (!this.#map || this.#workouts.length === 0) return;

    // Create a Leaflet LatLngBounds object
    const bounds = L.latLngBounds();

    // Extend bounds to include all workout coordinates
    this.#workouts.forEach((workout) => {
      bounds.extend(workout.coords);
    });

    // Fit the map to the bounds with padding
    this.#map.fitBounds(bounds, {
      padding: [50, 50], // Padding in pixels (top/bottom, left/right)
      maxZoom: 16, // Prevent excessive zoom if only 1 workout
    });
  }

  _updateFitAllButton() {
    const fitAllBtn = document.querySelector('.fit-all-btn');
    if (fitAllBtn) {
      fitAllBtn.disabled = this.#workouts.length === 0;
    }
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
    let coords;
    if (this.#currentShape) {
      // Use the shape data
      coords = this._getShapeCoords(
        this.#currentShape.layer,
        this.#currentShape.type
      );
    } else {
      // Fallback to point if no shape was drawn
      const { lat, lng } = this.#mapEvent.latlng;
      coords = [lat, lng];
    }

    let workout;
    const shapeType = this.#currentShape ? this.#currentShape.type : 'marker';

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

      workout = new Running(coords, distance, duration, cadence);
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

      workout = new Cycling(coords, distance, duration, elevation);
    }

    // Set the shape type
    workout.shapeType = shapeType;

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutShape(
      workout,
      this.#currentShape ? this.#currentShape.layer : null
    );

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

    this._updateFitAllButton();

    this.#currentShape = null;
  }

  _renderWorkoutShape(workout, existingLayer = null) {
    let shapeLayer;

    if (existingLayer) {
      // Use the existing layer that was drawn
      shapeLayer = existingLayer;
      // Add workout ID to the layer for later reference
      shapeLayer.options.workoutId = workout.id;
    } else {
      // Create a new layer based on stored data
      switch (workout.shapeType) {
        case 'marker':
          shapeLayer = L.marker(workout.coords);
          break;
        case 'polyline':
          shapeLayer = L.polyline(workout.coords, {
            color: workout.type === 'running' ? '#00c46a' : '#ffb545',
          });
          break;
        case 'polygon':
          shapeLayer = L.polygon(workout.coords, {
            color: workout.type === 'running' ? '#00c46a' : '#ffb545',
          });
          break;
        case 'rectangle':
          shapeLayer = L.rectangle(
            [
              [workout.coords[0][0], workout.coords[0][1]],
              [workout.coords[1][0], workout.coords[1][1]],
            ],
            { color: workout.type === 'running' ? '#00c46a' : '#ffb545' }
          );
          break;
        case 'circle':
          shapeLayer = L.circle(workout.coords, {
            radius: workout.radius || 1000, // Default radius if not stored
            color: workout.type === 'running' ? '#00c46a' : '#ffb545',
          });
          break;
      }

      // Add workout ID to the layer
      shapeLayer.options.workoutId = workout.id;

      // Add to drawn items layer
      this.#drawnItems.addLayer(shapeLayer);
    }

    // Store reference to the layer
    this.#markers.set(workout.id, shapeLayer);

    // Add popup
    shapeLayer
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

    // Get the center point based on shape type
    let centerCoords;
    switch (workout.shapeType) {
      case 'marker':
      case 'circle':
        // For markers and circles, coords is already [lat, lng]
        centerCoords = workout.coords;
        break;
      case 'polyline':
      case 'polygon':
        // For lines and polygons, use the first point
        centerCoords = workout.coords[0];
        break;
      case 'rectangle':
        // For rectangles, calculate the center from the two corners
        const sw = workout.coords[0]; // Southwest corner
        const ne = workout.coords[1]; // Northeast corner
        centerCoords = [
          (sw[0] + ne[0]) / 2, // Average latitude
          (sw[1] + ne[1]) / 2, // Average longitude
        ];
        break;
      default:
        // Fallback to first coordinate if available
        centerCoords = Array.isArray(workout.coords[0])
          ? workout.coords[0]
          : workout.coords;
    }

    this.#map.setView(centerCoords, this.#mapZoomLevel, {
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

    // 3. Remove shape from map
    const shapeLayer = this.#markers.get(id);
    if (shapeLayer && this.#drawnItems.hasLayer(shapeLayer)) {
      this.#drawnItems.removeLayer(shapeLayer);
    }

    // 4. Update localStorage
    this._setLocalStorage();

    this._updateFitAllButton();

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

        // 2. Clear all drawn shapes
        this.#drawnItems.clearLayers();

        // 3. Clear workouts array
        this.#workouts = [];

        // 4. Remove all workout elements from DOM
        document.querySelectorAll('.workout').forEach((el) => el.remove());

        // 5. Reset editing state
        this.#editingId = null;

        // 6. Update localStorage
        this._setLocalStorage();

        this._updateFitAllButton();

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
        runningWorkout.shapeType = work.shapeType || 'marker';
        if (work.radius) runningWorkout.radius = work.radius;
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
        cyclingWorkout.shapeType = work.shapeType || 'marker';
        if (work.radius) cyclingWorkout.radius = work.radius;
        return cyclingWorkout;
      }
      return work;
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
      this._updateFitAllButton();
    }
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
