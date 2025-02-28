import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const Toast = ({ visible, message, type = 'info', onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!visible) return; // Prevent unnecessary re-runs
  
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  
    // Auto hide after 3 seconds
    const timer = setTimeout(() => {
      hide();
    }, 3000);
  
    return () => clearTimeout(timer);
  }, [visible]);
  

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  // Set background color based on type
  let backgroundColor, borderColor, iconText;
  switch (type) {
    case 'success':
      backgroundColor = '#E8F5E9';
      borderColor = '#4CAF50';
      iconText = '✓';
      break;
    case 'error':
      backgroundColor = '#FFEBEE';
      borderColor = '#F44336';
      iconText = '✗';
      break;
    case 'warning':
      backgroundColor = '#FFF8E1';
      borderColor = '#FFC107';
      iconText = '⚠';
      break;
    default:
      backgroundColor = '#E3F2FD';
      borderColor = '#2196F3';
      iconText = 'ℹ';
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
        <Text style={styles.icon}>{iconText}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: width - 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
  },
});

export default Toast;

