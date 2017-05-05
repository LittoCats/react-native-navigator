'use strict';

import React from 'react';
import ReactNative, {
  StyleSheet,
  Navigator
} from 'react-native';

import NavigatorNavigationBarStyles from './navigation-bar-style';
import {DefaultEmitter} from 'react-native-event-emitter'

class NavigatorNavigationBar extends Navigator.NavigationBar {
  static defaultProps = {
    navigationStyles: NavigatorNavigationBarStyles,
  };
}

var styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});

class NavigationBar extends React.Component {
  static propTypes = {
    navigator: NavigatorNavigationBar.propTypes.navigator.isRequired,
    title: React.PropTypes.node,
    leftButton: React.PropTypes.node,
    rightButton: React.PropTypes.node,
  };

  render() {
    DefaultEmitter.emit(this.props.navigator._navigationBarRenderEventType, this.props.navigator, {
      Title: this.props.title,
      LeftButton: this.props.leftButton,
      RightButton: this.props.rightButton
    });
    return null;
  }
}

export default NavigationBar;
export {NavigatorNavigationBar};
