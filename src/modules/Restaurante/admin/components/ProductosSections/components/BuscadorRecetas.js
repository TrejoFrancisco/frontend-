import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export const BuscadorRecetas = ({
  recetas = [],
  selectedRecetaId,
  onSelectReceta,
  placeholder = "Buscar receta",
}) => {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedReceta = recetas.find(
    (r) => r.id.toString() === selectedRecetaId?.toString()
  );

  const displayText = selectedReceta
    ? `${selectedReceta.clave} - ${selectedReceta.nombre}`
    : "";

  const filteredRecetas = recetas.filter((receta) => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase();
    return (
      receta.nombre.toLowerCase().includes(searchLower) ||
      receta.clave.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectReceta = (receta) => {
    onSelectReceta(receta.id.toString());
    setSearchText("");
    setShowDropdown(false);
  };

  const handleClearReceta = () => {
    onSelectReceta(null);
    setSearchText("");
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { color: "#000" }]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={showDropdown ? searchText : displayText}
        onChangeText={(text) => {
          setSearchText(text);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />

      {selectedReceta && !showDropdown && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearReceta}
        />
      )}

      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemSpecial]}
              onPress={handleClearReceta}
            >
              <Text style={styles.dropdownItemTextSpecial}>
                Vacio (producto directo)
              </Text>
            </TouchableOpacity>

            {filteredRecetas.map((receta) => (
              <TouchableOpacity
                key={receta.id}
                style={styles.dropdownItem}
                onPress={() => handleSelectReceta(receta)}
              >
                <Text style={styles.dropdownItemText}>
                  <Text style={styles.clave}>{receta.clave}</Text> -{" "}
                  {receta.nombre}
                </Text>
              </TouchableOpacity>
            ))}

            {filteredRecetas.length === 0 && (
              <Text style={styles.emptyText}>No se encontraron recetas</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    position: "relative",
    zIndex: 1000,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 10,
    padding: 4,
    zIndex: 2,
  },
  dropdown: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    maxHeight: 250,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    zIndex: 2000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemSpecial: {
    backgroundColor: "#f0f8ff",
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dropdownItemTextSpecial: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  clave: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  emptyText: {
    padding: 12,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },
});
