'use strict';

/////////////////////////////////////////////////////////////////////////////////////
//WORKOUT ARCHITECTURE
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    //if does not work we have to define the porperties here
    // this.date = ...
    // this.id = ...

    this.coords = coords; // [lat, lon]
    this.distance = distance; // in km
    this.duration = duration; //in min
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

/////////////////////////////////////////////////////////////////////////////////////
//RUNNING ARCHITECTURE
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  //steps per min
  calcPace() {
    //in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

/////////////////////////////////////////////////////////////////////////////////////
//CYCLING ARCHITECTURE
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    // this.type = 'cycling';
    this._setDescription();
  }

  calcSpeed() {
    //in km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([42, 24], 5.2, 30, 178);
// const cycling1 = new Running([42, 25], 15, 45, 300);
// console.log(run1);
// console.log(cycling1);

/////////////////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  //private propertys
  #map;
  #mapEvent;
  //workouts will be an empty array
  #workouts = [];

  //methods are called in the contructor because they will be called automatically when we make an App object
  constructor() {
    //get the position when the page loads
    this._getPosition();

    //press enter for submitting not a button
    //this keyword will point to the form object, fix with bind to point on the App
    form.addEventListener('submit', this._newWorkout.bind(this));

    //switch between running and cycling
    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    //get data from local storage
    this._getLocalStorage();
  }

  _getPosition() {
    //get the current location
    if (navigator.geolocation)
      //bind the this keywows otherwise will be undefined in the loadMap method
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(
    //   `https://www.google.ro/maps/@${latitude},${longitude},13z?hl=en-GB`
    // );

    //store coords in array
    const coords = [latitude, longitude];

    //display a map with a third party tool (leaflet)
    //we need an element with the id of map, the second value in the setView is the zoom
    this.#map = L.map('map').setView(coords, 15);
    //   console.log(map);

    //using the leaflet tool
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker(coords).addTo(this.#map).bindPopup('Current location').openPopup();

    //click on the map function
    this.#map.on('click', this._showForm.bind(this));

    //render the data, its in the load map method because we cant display the markers on the map before the map load in
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    //hide form
    form.style.display = 'none';
    form.classList.add('hidden');

    //add grid style after 1sec
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    //selects parent
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //with REST parameter (...) we get an array
    //every method will be true if all the finite methods turned back true
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    //check if the numbers are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //check if data isvalid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        //if all of these ara number retunrs true
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //check if data isvalid
      if (
        //if all of these ara number retunrs true
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);
    // console.log(workout);

    //render workout on map as a marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //hide the from
    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();

    // //clear input fields
    // inputDistance.value =
    //   inputDuration.value =
    //   inputCadence.value =
    //   inputElevation.value =
    //     '';
  }

  _renderWorkoutMarker(workout) {
    // display marker
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

    if (workout.type === 'running') {
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
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    //its an API that browser provides for us, just like the navigation but -> only for small amount of data
    //we need a key and a value string (JSON)
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    //first is the identifier (workout)
    //we need to use the oposit of JSON.stringify to get back the objects
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;

    //restoring data
    this.#workouts = data;

    //render the data
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });

    //its not working because the map has to load in first, this is why we put this in the loadmap function
    // this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
