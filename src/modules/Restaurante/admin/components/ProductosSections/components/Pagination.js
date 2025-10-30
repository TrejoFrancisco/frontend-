import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onNext,
  onPrevious,
}) => {
  const getPageNumbers = () => {
    const numbers = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          numbers.push(i);
        }
        numbers.push("...");
        numbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        numbers.push(1);
        numbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          numbers.push(i);
        }
      } else {
        numbers.push(1);
        numbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          numbers.push(i);
        }
        numbers.push("...");
        numbers.push(totalPages);
      }
    }

    return numbers;
  };

  if (totalPages === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, currentPage === 1 && styles.buttonDisabled]}
        onPress={onPrevious}
        disabled={currentPage === 1}
      >
        <Text style={styles.buttonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.numbers}>
        {getPageNumbers().map((number, index) => {
          if (number === "...") {
            return (
              <Text key={`dots-${index}`} style={styles.dots}>
                ...
              </Text>
            );
          }
          return (
            <TouchableOpacity
              key={number}
              style={[
                styles.number,
                currentPage === number && styles.numberActive,
              ]}
              onPress={() => onPageChange(number)}
            >
              <Text
                style={[
                  styles.numberText,
                  currentPage === number && styles.numberTextActive,
                ]}
              >
                {number}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          currentPage === totalPages && styles.buttonDisabled,
        ]}
        onPress={onNext}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.buttonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  numbers: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  number: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  numberActive: {
    backgroundColor: "#4CAF50",
  },
  numberText: {
    fontSize: 16,
    color: "#333",
  },
  numberTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  dots: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 4,
  },
});
