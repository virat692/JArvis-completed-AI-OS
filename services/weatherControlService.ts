/**
 * JARVIS Weather Control System Service
 * Provides systematic control for JARVIS over all Weather Panel settings,
 * options, view modes, city selections, day inspection cards, and vocalizations.
 */

export type WeatherUnit = 'C' | 'F';

export interface WeatherControlState {
  isFullModalOpen: boolean;
  currentCity: string;
  currentState: string;
  locationMode: 'live_gps' | 'ip_auto' | 'custom';
  selectedDayIdx: number | null;
  unit: WeatherUnit;
  isSearching: boolean;
  showKeyDrawer: boolean;
  isInspectingDay: boolean;
  inspectedDayData: any | null;
  lastUpdated: number;
}

export type WeatherControlAction =
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_MODAL'; open?: boolean }
  | { type: 'SET_CITY'; city: string; state?: string }
  | { type: 'SET_COORDS'; lat: number; lon: number; city?: string; state?: string }
  | { type: 'TRACK_GPS' }
  | { type: 'SET_UNIT'; unit: WeatherUnit }
  | { type: 'TOGGLE_UNIT' }
  | { type: 'SELECT_DAY'; index: number }
  | { type: 'DESELECT_DAY' }
  | { type: 'INSPECT_DAY'; index: number }
  | { type: 'CLOSE_DAY_INSPECTION' }
  | { type: 'TOGGLE_SEARCH'; open?: boolean }
  | { type: 'TOGGLE_KEY_DRAWER'; open?: boolean }
  | { type: 'REFRESH_WEATHER' }
  | { type: 'SPEAK_WEATHER'; queryType?: string; dayIndex?: number }
  | { type: 'EXECUTE_JARVIS_WEATHER_COMMAND'; command: string };

type WeatherListener = (action: WeatherControlAction) => void;
type StateListener = (state: WeatherControlState) => void;

class WeatherControlService {
  private static instance: WeatherControlService;
  private actionListeners: Set<WeatherListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();

  private state: WeatherControlState = {
    isFullModalOpen: false,
    currentCity: 'Lucknow',
    currentState: 'UP, India',
    locationMode: 'live_gps',
    selectedDayIdx: 0,
    unit: 'C',
    isSearching: false,
    showKeyDrawer: false,
    isInspectingDay: false,
    inspectedDayData: null,
    lastUpdated: Date.now(),
  };

  private constructor() {
    // Load persisted unit preference if any
    if (typeof localStorage !== 'undefined') {
      const savedUnit = localStorage.getItem('jarvis_weather_unit') as WeatherUnit;
      if (savedUnit === 'C' || savedUnit === 'F') {
        this.state.unit = savedUnit;
      }
    }
  }

  public static getInstance(): WeatherControlService {
    if (!WeatherControlService.instance) {
      WeatherControlService.instance = new WeatherControlService();
    }
    return WeatherControlService.instance;
  }

  public getState(): WeatherControlState {
    return { ...this.state };
  }

  public updateState(partial: Partial<WeatherControlState>) {
    this.state = { ...this.state, ...partial, lastUpdated: Date.now() };
    if (partial.unit && typeof localStorage !== 'undefined') {
      localStorage.setItem('jarvis_weather_unit', partial.unit);
    }
    this.notifyStateListeners();
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => this.stateListeners.delete(listener);
  }

  public subscribeAction(listener: WeatherListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  public dispatch(action: WeatherControlAction) {
    // Synchronously update local state for fast UI feedback
    switch (action.type) {
      case 'OPEN_MODAL':
        this.updateState({ isFullModalOpen: true });
        break;
      case 'CLOSE_MODAL':
        this.updateState({ isFullModalOpen: false, isInspectingDay: false });
        break;
      case 'TOGGLE_MODAL':
        this.updateState({
          isFullModalOpen: action.open !== undefined ? action.open : !this.state.isFullModalOpen,
        });
        break;
      case 'SET_CITY':
        this.updateState({
          currentCity: action.city,
          currentState: action.state || '',
          locationMode: 'custom',
          isSearching: false,
        });
        break;
      case 'SET_UNIT':
        this.updateState({ unit: action.unit });
        break;
      case 'TOGGLE_UNIT':
        this.updateState({ unit: this.state.unit === 'C' ? 'F' : 'C' });
        break;
      case 'SELECT_DAY':
        this.updateState({ selectedDayIdx: action.index });
        break;
      case 'INSPECT_DAY':
        this.updateState({ selectedDayIdx: action.index, isInspectingDay: true });
        break;
      case 'CLOSE_DAY_INSPECTION':
        this.updateState({ isInspectingDay: false });
        break;
      case 'TOGGLE_SEARCH':
        this.updateState({
          isSearching: action.open !== undefined ? action.open : !this.state.isSearching,
        });
        break;
      case 'TOGGLE_KEY_DRAWER':
        this.updateState({
          showKeyDrawer: action.open !== undefined ? action.open : !this.state.showKeyDrawer,
        });
        break;
    }

    // Broadcast action to all subscribers (e.g. WeatherPanel component)
    this.actionListeners.forEach((listener) => {
      try {
        listener(action);
      } catch (err) {
        console.error('Error in WeatherControl action listener:', err);
      }
    });
  }

  private notifyStateListeners() {
    const currentState = this.getState();
    this.stateListeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in WeatherControl state listener:', err);
      }
    });
  }

  // --- Convenience Helper Methods for JARVIS Direct Control ---

  public openWeather() {
    this.dispatch({ type: 'OPEN_MODAL' });
  }

  public closeWeather() {
    this.dispatch({ type: 'CLOSE_MODAL' });
  }

  public setCity(city: string, state?: string) {
    this.dispatch({ type: 'SET_CITY', city, state });
  }

  public trackGPS() {
    this.dispatch({ type: 'TRACK_GPS' });
  }

  public setUnit(unit: WeatherUnit) {
    this.dispatch({ type: 'SET_UNIT', unit });
  }

  public toggleUnit() {
    this.dispatch({ type: 'TOGGLE_UNIT' });
  }

  public selectDay(index: number) {
    this.dispatch({ type: 'SELECT_DAY', index });
  }

  public inspectDay(index: number) {
    this.dispatch({ type: 'INSPECT_DAY', index });
  }

  public speakWeather(queryType: string = 'all', dayIndex?: number) {
    this.dispatch({ type: 'SPEAK_WEATHER', queryType, dayIndex });
  }

  public refresh() {
    this.dispatch({ type: 'REFRESH_WEATHER' });
  }
}

export const weatherControlService = WeatherControlService.getInstance();
