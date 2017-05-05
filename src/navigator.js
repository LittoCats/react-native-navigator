'use strict';

import React, { Component } from 'react';

import ReactNative, {
  PixelRatio,
  StyleSheet,
  ART,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import TimerMixin from 'react-timer-mixin'
import ReactMixin from 'react-mixin'

const {Path, Surface, Shape} = ART;

import {DefaultEmitter} from 'react-native-event-emitter'

import NavigationBar, {NavigatorNavigationBar} from './navigation-bar'

export {NavigationBar};

export default class Navigator extends ReactNative.Navigator {
  static NavigationBar = NavigationBar;
  static defaultProps = {
    ... ReactNative.Navigator.defaultProps,
    renderScene: function(route, navigator) {
      if (!route) return null;
      const Scene = route.scene || route.Scene;
      const Props = route.props || route.Props;
      const nav = {__navigatorRouteID: route.__navigatorRouteID, __proto__: navigator};
      return <Scene {... Props} navigator={nav} route={route}/>;
    },
    configureScene: (route, navigator)=> route ? route.configureScene || route.ConfigureScene || Navigator.SceneConfigs.PushFromRight : Navigator.SceneConfigs.PushFromRight,
    navigationBar: <NavigatorNavigationBar 
      routeMapper={{
        Title: e=>{},
        LeftButton: e=>{},
        RightButton: e=>{},
        Background: e=>{}
      }}
    />
  };

  _navigationBarRenderEventType = DefaultEmitter.makeType();

  constructor(props) {
    super(props);
  
    Object.defineProperty(this, '_renderNavigationBar', {
      enumerable: false,
      configurable: false,
      value: _renderNavigationBar
    });

    let subscribe = undefined;
    Object.defineProperty(this, '$NavigationBarSubscribe', {
      enumerable: false,
      configurable: false,
      get: function() { return subscribe; },
      set: function(sub) {
        if (subscribe) subscribe.remove();
        subscribe = sub;
      }
    })
  }

  componentWillUnmount() {
    const cwum = ReactNative.Navigator.prototype.componentWillUnmount;
    if (cwum) cwum.call(this);
    if (this.$NavigationBarSubscribe) this.$NavigationBarSubscribe.remove()
  }
}

function _renderNavigationBar() {
  
  const routeMappers = {};
  this.$NavigationBarSubscribe = DefaultEmitter.addListener(this._navigationBarRenderEventType, (navigator, mapper)=>{
    const _id = navigator.__navigatorRouteID;
    routeMappers[_id] = mapper;
  });
  return React.cloneElement(this.props.navigationBar, {
    ref: (navBar) => this._navBar = navBar,
    navigator: this._navigationBarNavigator,
    navState: this.state,
    routeMapper: {
      Title: function(route, navigator, index, navState){ return <NavigationBarItem {... {route, navigator, index, navState, routeMappers, type: 'Title'}} />;},
      LeftButton: function(route, navigator, index, navState){ return <NavigationBarItem {... {route, navigator, index, navState, routeMappers, type: 'LeftButton'}}/>;},
      RightButton: function(route, navigator, index, navState){ return <NavigationBarItem {... {route, navigator, index, navState, routeMappers, type: 'RightButton'}}/>;},
      Background: function(route, navigator, index, navState){ return <NavigationBarItem {... {route, navigator, index, navState, routeMappers, type: 'Background'}}/>;}
    }
  });
}

class NavigationBarItem extends Component {
  static propTypes = {
    route: React.PropTypes.object.isRequired, 
    navigator: React.PropTypes.object.isRequired, 
    index: React.PropTypes.number.isRequired, 
    navState: React.PropTypes.object.isRequired, 
    routeMappers: React.PropTypes.object.isRequired, 
    type: React.PropTypes.string.isRequired
  }
  componentDidMount() {
    this.$Subscribe = DefaultEmitter.addListener(this.props.navigator._navigationBarRenderEventType, (navigator, mapper)=>{
      const {route} = this.props;
      if (!route || route.__navigatorRouteID != navigator.__navigatorRouteID) return;
      this.setImmediate(()=>this.setState({... this.state}));
    })
  }
  componentWillUnmount() {
    this.$Subscribe.remove();
  }
  render() {
    const {route, navigator, index, navState, routeMappers, type} = this.props;
    if (!route) return null;
    const mapper = routeMappers[route.__navigatorRouteID]
    if (!mapper) return null;
    let child = this[`_render${type}`].call(this, mapper[type], navigator, index, mapper);
    return child;
  }

  _renderBackground(child, navigator, index) {
    return child ? child : <View style={styles.bar_background}/>;
  }

  _renderTitle(child, navigator, index) {
    if (typeof child === 'string') {
      child = <Text>{child}</Text>
    }
    return child || null;
  }

  _renderLeftButton(child, navigator, index) {
    return child ? child : !index ? null : <BackIndicator onPress={navigator.pop}/>;
  }

  _renderRightButton(child, navigator, index) {
    return child || null;
  }  
}

ReactMixin(NavigationBarItem.prototype, TimerMixin);

class BackIndicator extends Component {
  static width = 36;
  static height = 22;
  static propTypes = {
    color: React.PropTypes.string,
    onPress: React.PropTypes.func
  }
  render() {
    const width = BackIndicator.width;
    const height = BackIndicator.height;

    const dec = 2;

    const path = new Path()
    .moveTo(13, height/2)
    .lineTo(13+height/2, 0)
    .lineTo(13+height/2+dec, dec)
    .lineTo(13+dec+dec, height/2)
    .lineTo(13+height/2+dec, height-dec)
    .lineTo(13+height/2, height)
    .close();

    return (
      <TouchableOpacity onPress={this.props.onPress}>
      <View style={{width: width, height: height, alignSelf: 'center'}} >
        <Surface width={width} height={height}>
          <Shape d={path} fill={this.props.color || '#487EFB'}/>
        </Surface>
      </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  bar_background: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF78',
    borderBottomWidth: 1/PixelRatio.get(),
    borderBottomColor: '#00000033'
  }
});