'use strict';

var React = require('React');
var Platform = require('Platform');
var StyleSheet = require('StyleSheet');
var View = require('View');

var guid = require('guid');

var { Map } = require('immutable');

import {DefaultEmitter} from 'react-native-event-emitter'
var NavigatorNavigationBarStyles = require('./navigation-bar-style');

var COMPONENT_NAMES = ['Background', 'Title', 'LeftButton', 'RightButton'];

var navStatePresentedIndex = function(navState) {
  if (navState.presentedIndex !== undefined) {
    return navState.presentedIndex;
  }
  // TODO: rename `observedTopOfStack` to `presentedIndex` in `NavigatorIOS`
  return navState.observedTopOfStack;
};

class NavigatorNavigationBar extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object,
    routeMapper: React.PropTypes.shape({
      Title: React.PropTypes.func.isRequired,
      LeftButton: React.PropTypes.func.isRequired,
      RightButton: React.PropTypes.func.isRequired,
      Background: React.PropTypes.func.isRequired
    }).isRequired,
    navState: React.PropTypes.shape({
      routeStack: React.PropTypes.arrayOf(React.PropTypes.object),
      presentedIndex: React.PropTypes.number,
    }),
    navigationStyles: React.PropTypes.object,
    style: View.propTypes.style,
  };

  static Styles = NavigatorNavigationBarStyles;

  static defaultProps = {
    navigationStyles: NavigatorNavigationBarStyles,
  };

  componentWillMount() {
    this._reset();
  }

  /**
   * Stop transtion, immediately resets the cached state and re-render the
   * whole view.
   */
  immediatelyRefresh = () => {
    this._reset();
    this.forceUpdate();
  };

  _reset = () => {
    this._key = guid();
    this._reusableProps = {};
    this._components = {};
    this._descriptors = {};

    COMPONENT_NAMES.forEach(componentName => {
      this._components[componentName] = new Map();
      this._descriptors[componentName] = new Map();
    });
  };

  _getReusableProps = (/*string*/componentName, /*number*/index) => /*object*/ {
    var propStack = this._reusableProps[componentName];
    if (!propStack) {
      propStack = this._reusableProps[componentName] = [];
    }
    var props = propStack[index];
    if (!props) {
      props = propStack[index] = {style:{}};
    }
    return props;
  };

  _updateIndexProgress = (
    /*number*/progress,
    /*number*/index,
    /*number*/fromIndex,
    /*number*/toIndex,
  ) => {
    var amount = toIndex > fromIndex ? progress : (1 - progress);
    var oldDistToCenter = index - fromIndex;
    var newDistToCenter = index - toIndex;
    var interpolate;
    if (oldDistToCenter > 0 && newDistToCenter === 0 ||
        newDistToCenter > 0 && oldDistToCenter === 0) {
      interpolate = this.props.navigationStyles.Interpolators.RightToCenter;
    } else if (oldDistToCenter < 0 && newDistToCenter === 0 ||
               newDistToCenter < 0 && oldDistToCenter === 0) {
      interpolate = this.props.navigationStyles.Interpolators.CenterToLeft;
    } else if (oldDistToCenter === newDistToCenter) {
      interpolate = this.props.navigationStyles.Interpolators.RightToCenter;
    } else {
      interpolate = this.props.navigationStyles.Interpolators.RightToLeft;
    }

    COMPONENT_NAMES.forEach(function (componentName) {
      var component = this._components[componentName].get(this.props.navState.routeStack[index]);
      var props = this._getReusableProps(componentName, index);
      if (component && interpolate[componentName](props.style, amount)) {
        props.pointerEvents = props.style.opacity === 0 ? 'none' : 'box-none';
        component.setNativeProps(props);
      }
    }, this);
  };

  updateProgress = (/*number*/progress, /*number*/fromIndex, /*number*/toIndex) => {
    var max = Math.max(fromIndex, toIndex);
    var min = Math.min(fromIndex, toIndex);
    for (var index = min; index <= max; index++) {
      this._updateIndexProgress(progress, index, fromIndex, toIndex);
    }
  };

  render() {
    var navBarStyle = {
      height: this.props.navigationStyles.General.TotalNavHeight,
    };
    var navState = this.props.navState;
    var components = navState.routeStack.map((route, index) =>
      COMPONENT_NAMES.map(componentName =>
        this._getComponent(componentName, route, index)
      )
    );

    return (
      <View
        key={this._key}
        style={[styles.navBarContainer, navBarStyle, this.props.style]}>
        {components}
      </View>
    );
  }

  _getComponent = (/*string*/componentName, /*object*/route, /*number*/index) => /*?Object*/ {
    if (this._descriptors[componentName].includes(route)) {
      return this._descriptors[componentName].get(route);
    }

    var rendered = null;

    var content = this.props.routeMapper[componentName](
      this.props.navState.routeStack[index],
      this.props.navigator,
      index,
      this.props.navState
    );
    if (!content) {
      return null;
    }

    var componentIsActive = index === navStatePresentedIndex(this.props.navState);
    var initialStage = componentIsActive ?
      this.props.navigationStyles.Stages.Center :
      this.props.navigationStyles.Stages.Left;
    rendered = (
      <View
        ref={(ref) => {
          this._components[componentName] = this._components[componentName].set(route, ref);
        }}
        pointerEvents={componentIsActive ? 'box-none' : 'none'}
        style={initialStage[componentName]}>
        {content}
      </View>
    );

    this._descriptors[componentName] = this._descriptors[componentName].set(route, rendered);
    return rendered;
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
