import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Platform,
  TouchableOpacity,
  Pressable
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function FinalScoreScreen({ testScore = 0, diagnosisScore = 0, totalScore = 0, onRestart }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef({
    title: new Animated.Value(-50),
    subtitle: new Animated.Value(-30),
    scoreCard: new Animated.Value(50),
    testScore: new Animated.Value(30),
    diagScore: new Animated.Value(30),
    button: new Animated.Value(40)
  }).current;
  
  // Progress calculations
  const totalProgress = Math.min((totalScore / 10) * 100, 100);
  const testProgress = (testScore / 5) * 100;
  const diagnosisProgress = (diagnosisScore / 5) * 100;
  
  // Performance grade based on total score
  const getGrade = () => {
    if (totalScore >= 9) return { text: "Excellent", color: "#2E7D32" };
    if (totalScore >= 7) return { text: "Good", color: "#1976D2" };
    if (totalScore >= 5) return { text: "Average", color: "#FFA000" };
    return { text: "Needs Improvement", color: "#D32F2F" };
  };
  
  const grade = getGrade();
  
  // Progress animation values
  const testProgressAnim = useRef(new Animated.Value(0)).current;
  const diagnosisProgressAnim = useRef(new Animated.Value(0)).current;
  const totalProgressAnim = useRef(new Animated.Value(0)).current;
  
  // Interpolated values for progress
  const testProgressWidth = testProgressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });
  
  const diagnosisProgressWidth = diagnosisProgressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });
  
  const totalProgressWidth = totalProgressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  // Run animations on component mount
  useEffect(() => {
    // Sequence of staggered animations for a nice entry effect
    Animated.sequence([
      // Fade and scale the entire container
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        })
      ]),
      
      // Animate the elements in sequence
      Animated.stagger(100, [
        // Title slides in
        Animated.timing(slideAnim.title, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        }),
        // Subtitle slides in
        Animated.timing(slideAnim.subtitle, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        }),
        // Score card slides in
        Animated.timing(slideAnim.scoreCard, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }),
        // Progress bars animate
        Animated.parallel([
          Animated.timing(testProgressAnim, {
            toValue: testProgress,
            duration: 800,
            useNativeDriver: false  // progress width can't use native driver
          }),
          Animated.timing(diagnosisProgressAnim, {
            toValue: diagnosisProgress,
            duration: 800,
            useNativeDriver: false
          }),
          Animated.timing(totalProgressAnim, {
            toValue: totalProgress,
            duration: 1000,
            useNativeDriver: false
          })
        ]),
        // Button slides in last
        Animated.timing(slideAnim.button, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, []);

  // Get a confetti message based on score
  const getConfettiMessage = () => {
    if (totalScore >= 9) return "Outstanding Performance! 🌟";
    if (totalScore >= 7) return "Great Job! 🎉";
    if (totalScore >= 5) return "Well Done! 👍";
    return "Completed! 🏁";
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(46, 125, 50, 0.1)', 'rgba(46, 125, 50, 0.05)', 'rgba(255, 255, 255, 0)']}
        style={styles.gradientBackground}
      />
      
      {/* Header Section */}
      <Animated.Text 
        style={[
          styles.congratsText,
          { transform: [{ translateY: slideAnim.title }] }
        ]}
      >
        {getConfettiMessage()}
      </Animated.Text>
      
      <Animated.Text 
        style={[
          styles.finalScore,
          { transform: [{ translateY: slideAnim.subtitle }] }
        ]}
      >
        You've successfully completed the medical simulation.
      </Animated.Text>
      
      {/* Total Score Card */}
      <Animated.View 
        style={[
          styles.totalScoreCard,
          { transform: [{ translateY: slideAnim.scoreCard }] }
        ]}
      >
        <View style={styles.totalScoreRow}>
          <Text style={styles.totalScoreLabel}>Total Score</Text>
          <Text style={styles.totalScoreValue}>{totalScore}/10</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: totalProgressWidth,
                  backgroundColor: grade.color
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeLabel}>Performance:</Text>
          <Text style={[styles.gradeValue, { color: grade.color }]}>
            {grade.text}
          </Text>
        </View>
      </Animated.View>
      
      {/* Individual Score Cards */}
      <Animated.View 
        style={[
          styles.scoreContainer,
          { transform: [{ translateY: slideAnim.scoreCard }] }
        ]}
      >
        {/* Test Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeaderRow}>
            <View style={styles.scoreIconContainer}>
              <Text style={styles.scoreIcon}>🩻</Text>
            </View>
            <Text style={styles.scoreCardTitle}>Test Score</Text>
          </View>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{testScore}/5</Text>
            <Text style={styles.scorePercentage}>
              {Math.round(testProgress)}%
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: testProgressWidth }
                ]}
              />
            </View>
          </View>
        </View>
        
        {/* Diagnosis Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeaderRow}>
            <View style={styles.scoreIconContainer}>
              <Text style={styles.scoreIcon}>🧑🏻‍⚕</Text>
            </View>
            <Text style={styles.scoreCardTitle}>Diagnosis Score</Text>
          </View>
          
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{diagnosisScore}/5</Text>
            <Text style={styles.scorePercentage}>
              {Math.round(diagnosisProgress)}%
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: diagnosisProgressWidth }
                ]}
              />
            </View>
          </View>
        </View>
      </Animated.View>
      
      {/* Feedback Text */}
      <Animated.Text 
        style={[
          styles.feedbackText,
          { transform: [{ translateY: slideAnim.scoreCard }] }
        ]}
      >
        {totalScore >= 7 
          ? "You show strong clinical reasoning skills!"
          : "Keep practicing to improve your clinical reasoning skills."}
      </Animated.Text>
      
      {/* Button */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          { transform: [{ translateY: slideAnim.button }] }
        ]}
      >
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : {}
          ]}
          onPress={onRestart}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Try Another Case</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FFFA",
    padding: 20,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C786C",
    marginBottom: 10,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 18,
    color: "#555",
    marginBottom: 30,
    textAlign: "center",
  },
  totalScoreCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    maxWidth: 400,
    width: "100%",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  totalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalScoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  gradeLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 8,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: Platform.OS === 'web' && Dimensions.get('window').width > 700 ? 'row' : 'column',
    justifyContent: 'space-between',
    maxWidth: 800,
    width: "100%",
    marginBottom: 30,
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    flex: Platform.OS === 'web' && Dimensions.get('window').width > 700 ? 1 : undefined,
    marginHorizontal: Platform.OS === 'web' && Dimensions.get('window').width > 700 ? 10 : 0,
    marginBottom: Platform.OS === 'web' && Dimensions.get('window').width > 700 ? 0 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreIcon: {
    fontSize: 18,
  },
  scoreCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F3D3E',
  },
  scorePercentage: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    width: '100%',
    marginVertical: 4,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  feedbackText: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 400,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});