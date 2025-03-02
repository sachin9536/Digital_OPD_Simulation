
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Easing,
} from "react-native";
import {
  GiftedChat,
  Bubble,
  Send,
  SystemMessage,
  Day,
} from "react-native-gifted-chat";
import io from "socket.io-client";
import FinalScoreScreen from "./FinalScoreScreen";
import { LinearGradient } from "expo-linear-gradient";

const socket = io("ws://localhost:5000"); // Replace with actual server IP

// Initial State
const initialState = {
  messages: [],
  loading: true,
  gameState: {
    phase: "test",
    testScore: 5,
    diagnosisScore: 5,
    testAttempts: 0,
    diagnosisAttempts: 0,
    previousPhase: null,
    explanationProvided: false,
  },
};

// Reducer Function
function reducer(state, action) {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: GiftedChat.append(state.messages, [action.payload]),
      };
    case "UPDATE_GAME_STATE":
      return {
        ...state,
        gameState: {
          ...state.gameState,
          previousPhase: state.gameState.phase,
          ...action.payload,
        },
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export default function ChatScreen() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showTip, setShowTip] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scoreScale = useRef({
    test: new Animated.Value(1),
    diagnosis: new Animated.Value(1),
  }).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const phaseOpacity = useRef(new Animated.Value(0)).current;
  const phaseSlide = useRef(new Animated.Value(20)).current;
  const tipFade = useRef(new Animated.Value(0)).current;

  // Message animation references
  const messageAnimations = useRef({}).current;

  // Screen dimensions for responsive design
  const { width, height } = Dimensions.get("window");
  const isSmallScreen = width < 375;

  // Animation pulse effect for phase indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease), 
        }),
      ])
    ).start();
  }, []);

  // Show tip with animation after a delay
  useEffect(() => {
    if (!state.loading && state.gameState.phase === "test") {
      setTimeout(() => {
        setShowTip(true);
        Animated.timing(tipFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        // Auto-hide tip after 7 seconds
        setTimeout(() => {
          Animated.timing(tipFade, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }).start(() => setShowTip(false));
        }, 7000);
      }, 2000);
    }
  }, [state.loading, state.gameState.phase]);

  // Animate phase indicator
  useEffect(() => {
    if (state.gameState.phase !== state.gameState.previousPhase) {
      // Reset animation values
      phaseOpacity.setValue(0);
      phaseSlide.setValue(20);

      // Start new animation
      Animated.parallel([
        Animated.timing(phaseOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(phaseSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }
  }, [state.gameState.phase]);

  // Animate score change
  useEffect(() => {
    if (
      state.gameState.phase !== state.gameState.previousPhase &&
      state.gameState.previousPhase
    ) {
      // Animate score change based on which phase changed
      const keyToAnimate =
        state.gameState.phase === "diagnosis" ? "test" : "diagnosis";

      Animated.sequence([
        Animated.timing(scoreScale[keyToAnimate], {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.back()),
        }),
        Animated.timing(scoreScale[keyToAnimate], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state.gameState.phase]);

  // Fade in chat on initial load
  useEffect(() => {
    if (!state.loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }
  }, [state.loading]);

  useEffect(() => {
    console.log("Connecting to server...");
    socket.emit("request_patient");

    // Handle Patient Case
    // Handle Patient Case
    socket.on("patient_case", ({ patientDialogue, aiAnalysis }) => {
      console.log("Received patient case:", patientDialogue);
      dispatch({ type: "SET_LOADING", payload: false });

      // Create messages with patient first, then AI doctor
      // This ensures patient message appears above the doctor's response
      const messages = [
        {
          _id: 1,
          text: `🧑‍⚕️ Patient: ${patientDialogue}`,
          createdAt: new Date(Date.now() - 1000), // Slightly earlier timestamp
          user: {
            _id: 2,
            name: "Patient",
            avatar: "https://placekitten.com/200/200",
          },
        },
        {
          _id: 2,
          text: `🔬 AI Doctor: ${aiAnalysis}`,
          createdAt: new Date(), // Current timestamp
          user: {
            _id: 3,
            name: "Doctor",
            avatar: "https://placekitten.com/200/300",
          },
        },
      ];

      dispatch({ type: "SET_MESSAGES", payload: messages });

      // Create animation references for each message
      messages.forEach((msg) => {
        messageAnimations[msg._id] = {
          opacity: new Animated.Value(0),
          translateY: new Animated.Value(20),
        };
      });

      // Animate messages with delay between them
      messages.forEach((msg, index) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(messageAnimations[msg._id].opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(messageAnimations[msg._id].translateY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]).start();
        }, 400 + index * 800); // Stagger message animations
      });
    });

    // Handle Test Results
    socket.on("test_result", ({ correct, score, aiMessage, attempts }) => {
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          testScore: score,
          testAttempts: attempts,
          phase: correct ? "diagnosis" : "test",
        },
      });

      addSystemMessage(
        `${aiMessage}\n\n${
          correct ? `✅ Correct!` : `❌ Attempt ${attempts}: Try again.`
        }`
      );
    });

    // Handle Next Steps
    // Fix the next_step handler
    socket.on("next_step", ({ message }) => {
      console.log("Received next step:", message);

      const newMessage = {
        _id: Date.now(),
        text: `🩺 AI Doctor: ${message}`,
        createdAt: new Date(),
        user: {
          _id: 3,
          name: "Doctor",
          avatar: "https://placekitten.com/200/300",
        },
      };

      dispatch({ type: "ADD_MESSAGE", payload: newMessage });

      // Add animation reference *after* dispatch
      setTimeout(() => {
        if (!messageAnimations[newMessage._id]) {
          messageAnimations[newMessage._id] = {
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
          };

          Animated.parallel([
            Animated.timing(messageAnimations[newMessage._id].opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(messageAnimations[newMessage._id].translateY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, 10);
    });
    // Handle Diagnosis Results
    socket.on("diagnosis_result", ({ correct, score, aiMessage, attempts }) => {
      if (correct) {
        // When diagnosis is correct, don't change phase yet
        dispatch({
          type: "UPDATE_GAME_STATE",
          payload: {
            diagnosisScore: score,
            diagnosisAttempts: attempts,
            explanationProvided: true, // Set to true when correct diagnosis provided
          },
        });
        
        // Add system message with explanation
        addSystemMessage(
          `${aiMessage}\n\n🎉 Diagnosis Correct! Review the explanation and click "View Results" when ready.`
        );
        
        // Add the new "View Results" button message after a short delay
        setTimeout(() => {
          dispatch({
            type: "ADD_MESSAGE", 
            payload: {
              _id: Date.now(),
              text: "Ready to see your final results?",
              createdAt: new Date(),
              system: true,
              viewResultsButton: true, // Special flag for the button
            }
          });
        }, 1000);
      } else {
        // When diagnosis is incorrect, behavior remains the same
        dispatch({
          type: "UPDATE_GAME_STATE",
          payload: {
            diagnosisScore: score,
            diagnosisAttempts: attempts,
            phase: "diagnosis",
          },
        });
        
        addSystemMessage(
          `${aiMessage}\n\n⚠️ Attempt ${attempts}: Re-evaluate.`
        );
      }
    });

    // Handle Errors & Disconnections
    socket.on("connect_error", (err) => console.error("Socket Error:", err));
    socket.on("disconnect", () => {
      console.warn("Disconnected. Reconnecting...");
      setTimeout(() => socket.connect(), 3000);
    });

    return () => {
      socket.off("patient_case");
      socket.off("test_result");
      socket.off("next_step");
      socket.off("diagnosis_result");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, []);

  // Function to Add System Messages
  const addSystemMessage = (text) => {
    const newMessage = {
      _id: Date.now(),
      text,
      createdAt: new Date(),
      system: true,
    };

    dispatch({ type: "ADD_MESSAGE", payload: newMessage });

    // Create and animate new system message
    messageAnimations[newMessage._id] = {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    };

    Animated.parallel([
      Animated.timing(messageAnimations[newMessage._id].opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(messageAnimations[newMessage._id].translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  };

  // Handle Sending Messages
  // In your handleSend function
  const handleSend = (newMessages = []) => {
    if (!newMessages || newMessages.length === 0) return;

    const userMessage = newMessages[0];
    dispatch({ type: "ADD_MESSAGE", payload: userMessage });

    // Add animation reference after dispatch, if needed
    if (!messageAnimations[userMessage._id]) {
      messageAnimations[userMessage._id] = {
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
      };
    }

    // Extract text consistently with your original approach
    const messageText = userMessage.text;

    if (state.gameState.phase === "test") {
      console.log("Submitting test:", messageText);
      socket.emit("submit_test", { selectedTest: messageText });
    } else {
      console.log("Submitting diagnosis:", messageText);
      socket.emit("submit_diagnosis", { selectedDiagnosis: messageText });
    }
  };
  const renderBubble = (props) => {
    // Get animation values for this message
    const animations = messageAnimations[props.currentMessage._id];

    // Common bubble wrapper styles with text wrapping fixes
    const bubbleWrapperStyle = {
      left: {
        backgroundColor: "#E1F0FF",
        borderRadius: 18,
        padding: 3,
        marginBottom: 10,
        marginLeft: 2,
        borderWidth: 1,
        borderColor: "#D0E5FF",
        maxWidth: "80%", // Add max width constraint
      },
      right: {
        backgroundColor: "#0A84FF",
        borderRadius: 18,
        padding: 3,
        marginBottom: 10,
        marginRight: 2,
        maxWidth: "80%", // Add max width constraint
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
          },
          android: {
            elevation: 1,
          },
          web: {
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
          },
        }),
      },
    };

    // Common text styles with proper wrapping
    const bubbleTextStyle = {
      left: {
        color: "#333",
        fontWeight: "400",
        flexWrap: "wrap", // Ensure text wraps
      },
      right: {
        color: "#fff",
        fontWeight: "400",
        flexWrap: "wrap", // Ensure text wraps
      },
    };

    // If this message has animations, apply them
    if (animations) {
      return (
        <Animated.View
          style={{
            opacity: animations.opacity,
            transform: [{ translateY: animations.translateY }],
          }}
        >
          <Bubble
            {...props}
            wrapperStyle={bubbleWrapperStyle}
            textStyle={bubbleTextStyle}
          />
        </Animated.View>
      );
    }

    // Fallback for messages without animations
    return (
      <Bubble
        {...props}
        wrapperStyle={bubbleWrapperStyle}
        textStyle={bubbleTextStyle}
      />
    );
  };
  const renderSend = (props) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          marginRight: 10,
          marginBottom: 5,
        }}
      >
        <TouchableOpacity
          style={styles.sendButton}
          activeOpacity={0.7}
          // Add this line to trigger the send functionality
          onPress={() =>
            props.onSend &&
            props.text.trim().length > 0 &&
            props.onSend({ text: props.text.trim() }, true)
          }
        >
          <LinearGradient
            colors={["#007AFF", "#0A84FF", "#0064D1"]}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.sendButtonText}>
              {state.gameState.phase === "test"
                ? "Submit Test"
                : "Submit Diagnosis"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Send>
    );
  };
  const renderSystemMessage = (props) => {
    // Get animation values for this message
    const animations = messageAnimations[props.currentMessage._id];
    
    // Check if this is our "View Results" button message
    if (props.currentMessage.viewResultsButton) {
      return (
        <View style={styles.viewResultsContainer}>
          <TouchableOpacity 
            style={styles.viewResultsButton}
            onPress={() => {
              // Change game phase to completed to show final screen
              dispatch({
                type: "UPDATE_GAME_STATE",
                payload: {
                  phase: "completed"
                }
              });
            }}
          >
            <LinearGradient
              colors={["#4CAF50", "#2E7D32"]}
              style={styles.viewResultsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.viewResultsText}>View Final Results</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Original system message rendering logic...
    const Container = animations ? Animated.View : View;
    const containerStyle = animations
      ? {
          opacity: animations.opacity,
          transform: [{ translateY: animations.translateY }],
        }
      : {};
  
    return (
      <Container style={containerStyle}>
        <SystemMessage
          {...props}
          containerStyle={{
            backgroundColor: "#FFF8E1",
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            marginTop: 8,
            marginLeft: 16,
            marginRight: 16,
            maxWidth: "90%",
            alignSelf: "center",
            borderWidth: 1,
            borderColor: "#FFE082",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
              android: {
                elevation: 2,
              },
              web: {
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              },
            }),
          }}
          textStyle={{
            color: "#5D4037",
            fontWeight: "500",
            lineHeight: 20,
            flexWrap: "wrap",
          }}
        />
      </Container>
    );
  };
  // Custom day banner
  const renderDay = (props) => {
    return (
      <Day
        {...props}
        textStyle={{
          color: "#888",
          fontWeight: "600",
          fontSize: 12,
        }}
        wrapperStyle={{
          paddingVertical: 8,
          backgroundColor: "rgba(245, 247, 250, 0.8)",
          borderRadius: 12,
          marginTop: 8,
          marginBottom: 12,
          paddingHorizontal: 12,
        }}
      />
    );
  };

  // Render Loading Spinner with Animation
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#4c669f", "#3b5998", "#192f6a"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            Loading patient case...
          </Animated.Text>
          <Animated.Text
            style={[
              styles.loadingSubtext,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            Preparing your medical challenge
          </Animated.Text>
        </LinearGradient>
      </View>
    );
  };

  // Phase Indicator Component
  const PhaseIndicator = () => {
    const getPhaseLabel = () => {
      switch (state.gameState.phase) {
        case "test":
          return "Select appropriate tests";
        case "diagnosis":
          return "Make your diagnosis";
        default:
          return "";
      }
    };

    const getPhaseIcon = () => {
      switch (state.gameState.phase) {
        case "test":
          return "🔍";
        case "diagnosis":
          return "🩺";
        default:
          return "";
      }
    };

    return (
      <Animated.View
        style={[
          styles.phaseIndicator,
          {
            opacity: phaseOpacity,
            transform: [{ translateY: phaseSlide }, { scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={
            state.gameState.phase === "test"
              ? ["#4D7BFF", "#3664E0"]
              : ["#FF5733", "#E74C3C"]
          }
          style={styles.phaseGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.phaseIcon}>{getPhaseIcon()}</Text>
          <Text style={styles.phaseText}>{getPhaseLabel()}</Text>
        </LinearGradient>
      </Animated.View>
    );
  };
  // Either remove the function completely, or fix it like this:
const progress = useRef(new Animated.Value(0)).current;

const animatedStyle = () => {
  "worklet";
  return { opacity: progress.value };
};

  // Tip Component
  const TipComponent = () => {
    if (!showTip) return null;

    return (
      <Animated.View style={[styles.tipContainer, { opacity: tipFade }]}>
        <View style={styles.tipContent}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Start by ordering relevant tests based on patient symptoms
          </Text>
        </View>
      </Animated.View>
    );
    // Add this to your tip animation useEffect
  };

  return (
    <SafeAreaView style={styles.container}>
      {state.loading ? (
        renderLoading()
      ) : state.gameState.phase === "completed" ? (
        <FinalScoreScreen
          testScore={state.gameState.testScore}
          diagnosisScore={state.gameState.diagnosisScore}
          totalScore={
            state.gameState.testScore + state.gameState.diagnosisScore
          }
        />
      ) : (
        <Animated.View
          style={[
            styles.gameContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#4c669f", "#3b5998", "#192f6a"]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.headerTitle}>Medical OPD Simulation</Text>
            <Text style={styles.headerSubtitle}>
              Interactive Diagnostic Training
            </Text>
          </LinearGradient>

          <View style={styles.scoreBar}>
            <Animated.View
              style={[
                styles.scoreBox,
                { transform: [{ scale: scoreScale.test }] },
              ]}
            >
              <LinearGradient
                colors={["#F5F7FA", "#E4E7EB"]}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreLabel}>Test Score</Text>
                <Text style={styles.scoreValue}>
                  {state.gameState.testScore}/5
                </Text>
                <View style={styles.attemptsContainer}>
                  <Text style={styles.attemptsText}>
                    Attempts: {state.gameState.testAttempts}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <View style={styles.divider} />

            <Animated.View
              style={[
                styles.scoreBox,
                { transform: [{ scale: scoreScale.diagnosis }] },
              ]}
            >
              <LinearGradient
                colors={["#F5F7FA", "#E4E7EB"]}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreLabel}>Diagnosis</Text>
                <Text style={styles.scoreValue}>
                  {state.gameState.diagnosisScore}/5
                </Text>
                <View style={styles.attemptsContainer}>
                  <Text style={styles.attemptsText}>
                    Attempts: {state.gameState.diagnosisAttempts}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>

          <PhaseIndicator />
          <TipComponent />
          <GiftedChat
            messages={state.messages}
            onSend={handleSend}
            user={{ _id: 1 }}
            renderBubble={renderBubble}
            renderSend={renderSend}
            renderSystemMessage={renderSystemMessage}
            renderAvatar={null}
            renderDay={renderDay}
            alwaysShowSend={true}
            scrollToBottom
            // Using default GiftedChat behavior which is inverted={true}
            // This shows newer messages at the bottom, which is the expected chat behavior
            listViewProps={{
              style: { backgroundColor: "transparent" },
              contentContainerStyle: { paddingTop: 20 },
            }}
            minInputToolbarHeight={60}
            maxComposerHeight={100}
            textInputStyle={styles.textInput}
            placeholder={
              state.gameState.phase === "test"
                ? "Enter diagnostic test..."
                : "Enter your diagnosis..."
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Slightly lighter background for better contrast
  },
  gameContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingGradient: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28, // Slightly more rounded
    padding: 36,
    width: "80%",
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 0.3, // Slightly improved letter spacing
  },
  loadingSubtext: {
    marginTop: 10,
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "400",
  },
  header: {
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    colors: ["#0A6EBD", "#0353A4", "#023E7D"],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 7,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.18)",
      },
    }),
  },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
  },
  scoreBar: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginVertical: 14,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.14)",
      },
    }),
  },
  scoreBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  scoreGradient: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 12,
  },
  scoreLabel: {
    fontSize: 15,
    color: "#555",
    marginBottom: 5,
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  attemptsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 7,
  },
  attemptsText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  divider: {
    width: 1.5, // Slightly thicker divider
    backgroundColor: "#e5e5e5",
    marginVertical: 12,
  },
  textInput: {
    borderRadius: 26,
    backgroundColor: "white",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
    marginLeft: 10,
    fontSize: 16,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.12)",
      },
    }),
  },
  sendButton: {
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 5,
  },
  sendButtonGradient: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  phaseIndicator: {
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.18)",
      },
    }),
  },
  phaseGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  phaseIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  phaseText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  tipContainer: {
    position: "absolute",
    top: 200, // Slightly lower for better spacing
    alignSelf: "center",
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.22)",
      },
    }),
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  tipIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  tipText: {
    color: "#5D4037",
    fontWeight: "500",
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  // Add to the styles object
viewResultsContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: 20,
  paddingHorizontal: 20,
  alignSelf: 'center',
},
viewResultsButton: {
  borderRadius: 25,
  overflow: 'hidden',
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
    android: {
      elevation: 5,
    },
    web: {
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
    },
  }),
},
viewResultsGradient: {
  paddingVertical: 14,
  paddingHorizontal: 36,
  alignItems: 'center',
  justifyContent: 'center',
},
viewResultsText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 18,
  letterSpacing: 0.5,
},
});
