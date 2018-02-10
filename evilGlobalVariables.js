/**
 * This module sets up some global variables
 */

// Having a global __DEV__ is kind of a pattern already
global.__DEV__ = 'development' === process.env.NODE_ENV;
