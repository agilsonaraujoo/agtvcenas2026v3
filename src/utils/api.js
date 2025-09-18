export const API_CONFIG = {
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    API_KEY: process.env.REACT_APP_TMDB_API_KEY,
  },
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    API_KEY: process.env.REACT_APP_GEMINI_API_KEY,
  }
};
