import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { API } from "../../../../services/api";

export default function RecetasSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecetas, setIsLoadingRecetas] = useState(false);
  const [recetas, setRecetas] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [editingRecetas, setEditingRecetas] = useState(null);
  const [recetaDetalle, setRecetaDetalle] = useState(null);
  const [busquedaReceta, setBusquedaReceta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Estados para el buscador de materias primas
  const [busquedaMateriaPrima, setBusquedaMateriaPrima] = useState("");
  const [showMateriaPrimaDropdown, setShowMateriaPrimaDropdown] =
    useState(null);

  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 8;

  const [recetaData, setRecetaData] = useState({
    clave: "",
    nombre: "",
    estado: "activo",
    materias_primas: [],
  });

  useEffect(() => {
    fetchRecetas();
    fetchMateriasPrimas();
  }, []);

  const fetchRecetas = async () => {
    if (!token) return;
    setIsLoadingRecetas(true);
    try {
      const response = await API.get("/restaurante/admin/recetas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRecetas(response.data.data);
        // El backend ya recalcula los costos automáticamente
        if (response.data.costos_recalculados) {
        }
      }
    } catch (error) {
      console.log("Error al obtener recetas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setIsLoadingRecetas(false);
    }
  };

  const fetchMateriasPrimas = async () => {
    if (!token) return;
    try {
      const response = await API.get("/restaurante/admin/materias-primas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setMateriasPrimas(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener materias primas:", error);
    }
  };

  const fetchRecetaDetalle = async (recetaId) => {
    if (!token) return;
    try {
      const response = await API.get(`/restaurante/admin/show/${recetaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRecetaDetalle(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.log("Error al obtener detalle de receta:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la receta");
    }
    return null;
  };

  // Función para obtener la unidad de una materia prima
  const getUnidadMateriaPrima = (materiaPrimaId) => {
    const materiaPrima = materiasPrimas.find(
      (mp) => mp.id === parseInt(materiaPrimaId)
    );
    return materiaPrima ? materiaPrima.unidad : "";
  };

  // Función para filtrar materias primas en el buscador
  const getMateriasPrimasFiltradas = (searchText) => {
    if (!searchText.trim()) return [];

    return materiasPrimas.filter(
      (mp) =>
        mp.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        mp.clave.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  // Función para filtrar recetas por búsqueda y estado
  const getRecetasFiltradas = () => {
    let recetasFiltradas = recetas;

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      recetasFiltradas = recetasFiltradas.filter(
        (receta) => receta.estado === filtroEstado
      );
    }

    // Filtrar por búsqueda
    if (busquedaReceta.trim()) {
      recetasFiltradas = recetasFiltradas.filter(
        (receta) =>
          receta.nombre.toLowerCase().includes(busquedaReceta.toLowerCase()) ||
          receta.clave.toLowerCase().includes(busquedaReceta.toLowerCase())
      );
    }

    return recetasFiltradas;
  };

  // Función para obtener recetas paginadas
  const getRecetasPaginadas = () => {
    const recetasFiltradas = getRecetasFiltradas();
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    return recetasFiltradas.slice(inicio, fin);
  };

  // Calcular total de páginas
  const getTotalPaginas = () => {
    const recetasFiltradas = getRecetasFiltradas();
    return Math.ceil(recetasFiltradas.length / ITEMS_POR_PAGINA);
  };

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  const resetForm = () => {
    setRecetaData({
      clave: "",
      nombre: "",
      estado: "activo",
      materias_primas: [],
    });
    setEditingRecetas(null);
    setRecetaDetalle(null);
    setBusquedaMateriaPrima("");
    setShowMateriaPrimaDropdown(null);
  };

  const handleInputChange = (field, value) => {
    setRecetaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMateriaPrimaChange = (index, field, value) => {
    const updated = [...recetaData.materias_primas];
    updated[index][field] = value;
    setRecetaData((prev) => ({ ...prev, materias_primas: updated }));
  };

  const handleExistingMateriaPrimaChange = (materiaPrimaId, newCantidad) => {
    setRecetaDetalle((prev) => ({
      ...prev,
      materias_primas: prev.materias_primas.map((mp) =>
        mp.id === materiaPrimaId
          ? { ...mp, pivot: { ...mp.pivot, cantidad: newCantidad } }
          : mp
      ),
    }));
  };

  const removeExistingMateriaPrima = (materiaPrimaId) => {
    Alert.alert(
      "Eliminar Materia Prima",
      "¿Estás seguro de que deseas eliminar esta materia prima de la receta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setRecetaDetalle((prev) => ({
              ...prev,
              materias_primas: prev.materias_primas.filter(
                (mp) => mp.id !== materiaPrimaId
              ),
            }));
          },
        },
      ]
    );
  };

  const addMateriaPrima = () => {
    setRecetaData((prev) => ({
      ...prev,
      materias_primas: [
        ...prev.materias_primas,
        { materia_prima_id: "", cantidad: "", searchText: "" },
      ],
    }));
  };

  const removeMateriaPrima = (index) => {
    const updated = recetaData.materias_primas.filter((_, i) => i !== index);
    setRecetaData((prev) => ({ ...prev, materias_primas: updated }));
    setShowMateriaPrimaDropdown(null);
  };

  const selectMateriaPrima = (index, materiaPrima) => {
    const updated = [...recetaData.materias_primas];
    updated[index].materia_prima_id = materiaPrima.id;
    updated[
      index
    ].searchText = `${materiaPrima.clave} - ${materiaPrima.nombre}`;
    setRecetaData((prev) => ({ ...prev, materias_primas: updated }));
    setShowMateriaPrimaDropdown(null);
  };

  const handleSubmit = () => {
    if (modalType === "crear") {
      handleCreate();
    } else {
      handleEdit();
    }
  };

  const handleCreate = async () => {
    if (!recetaData.clave || !recetaData.nombre) {
      Alert.alert("Error", "Por favor completa clave y nombre de la receta");
      return;
    }

    if (recetaData.materias_primas.length === 0) {
      Alert.alert("Error", "Debes agregar al menos una materia prima");
      return;
    }

    const materiasInvalidas = recetaData.materias_primas.some(
      (mp) =>
        !mp.materia_prima_id || !mp.cantidad || parseFloat(mp.cantidad) <= 0
    );

    if (materiasInvalidas) {
      Alert.alert(
        "Error",
        "Completa todas las materias primas con cantidad válida"
      );
      return;
    }

    if (!token) {
      Alert.alert("Error", "Sesión expirada. Inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }

    const payload = {
      clave: recetaData.clave,
      nombre: recetaData.nombre,
      estado: recetaData.estado,
      materias_primas: recetaData.materias_primas.map((mp) => ({
        id: mp.materia_prima_id,
        cantidad: parseFloat(mp.cantidad),
      })),
    };

    setIsLoading(true);
    try {
      await API.post("/restaurante/admin/recetas", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert("Éxito", "Receta creada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchRecetas();
    } catch (error) {
      console.log(
        "Error al crear receta:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "No se pudo crear la receta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!token || !editingRecetas) return;

    const existentesInvalidas = recetaDetalle?.materias_primas?.some(
      (mp) => !mp.pivot.cantidad || parseFloat(mp.pivot.cantidad) <= 0
    );

    const nuevasInvalidas = recetaData.materias_primas.some(
      (mp) =>
        !mp.materia_prima_id || !mp.cantidad || parseFloat(mp.cantidad) <= 0
    );

    if (existentesInvalidas || nuevasInvalidas) {
      Alert.alert(
        "Error",
        "Todas las materias primas deben tener cantidad válida"
      );
      return;
    }

    setIsLoading(true);
    try {
      const materiasExistentes =
        recetaDetalle?.materias_primas?.map((mp) => ({
          id: mp.id,
          cantidad: parseFloat(mp.pivot.cantidad),
        })) || [];

      const materiasNuevas = recetaData.materias_primas.map((mp) => ({
        id: mp.materia_prima_id,
        cantidad: parseFloat(mp.cantidad),
      }));

      const dataToSend = {
        clave: recetaData.clave,
        nombre: recetaData.nombre,
        estado: recetaData.estado,
        materias_primas: [...materiasExistentes, ...materiasNuevas],
      };

      const response = await API.put(
        `/restaurante/admin/recetas/${editingRecetas.id}`,
        dataToSend,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Mostrar mensaje con información del producto afectado si existe
      let mensaje = response.data.message;
      if (response.data.data?.producto_afectado) {
        const producto = response.data.data.producto_afectado;
        mensaje += `\n\nProducto afectado:\n${producto.clave} - ${producto.nombre}`;
      }

      Alert.alert("Éxito", mensaje);
      setModalVisible(false);
      resetForm();
      fetchRecetas();
    } catch (error) {
      console.log(
        "Error al editar receta:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
        "No se pudo actualizar la receta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalType("crear");
    setModalVisible(true);
  };

  const openEditModal = async (item) => {
    setEditingRecetas(item);
    setModalType("editar");

    const detalle = await fetchRecetaDetalle(item.id);
    if (detalle) {
      setRecetaData({
        clave: detalle.clave,
        nombre: detalle.nombre,
        estado: detalle.estado,
        materias_primas: [],
      });
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const recetasPaginadas = getRecetasPaginadas();
  const totalPaginas = getTotalPaginas();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Recetas</Text>

      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <View style={styles.inlineContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.icon}
          />
          <Text style={styles.createButtonText}>Agregar Receta</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listContainer}>
        {/* Buscador y filtros */}
        <View style={styles.filtrosContainer}>
          <TextInput
            style={[styles.buscadorInput, { flex: 2, marginRight: 8 }]}
            placeholder="Buscar por clave o nombre..."
            value={busquedaReceta}
            onChangeText={(text) => {
              setBusquedaReceta(text);
              setPaginaActual(1);
            }}
          />

          <View style={styles.filtroEstadoContainer}>
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroEstado === "todos" && styles.filtroBotonActivo,
              ]}
              onPress={() => {
                setFiltroEstado("todos");
                setPaginaActual(1);
              }}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  filtroEstado === "todos" && styles.filtroTextoActivo,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroEstado === "activo" && styles.filtroBotonActivo,
              ]}
              onPress={() => {
                setFiltroEstado("activo");
                setPaginaActual(1);
              }}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  filtroEstado === "activo" && styles.filtroTextoActivo,
                ]}
              >
                Activos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filtroBoton,
                filtroEstado === "inactivo" && styles.filtroBotonActivo,
              ]}
              onPress={() => {
                setFiltroEstado("inactivo");
                setPaginaActual(1);
              }}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  filtroEstado === "inactivo" && styles.filtroTextoActivo,
                ]}
              >
                Inactivos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicador de carga */}
        {isLoadingRecetas && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>
              Cargando y recalculando costos...
            </Text>
          </View>
        )}

        {!isLoadingRecetas && (
          <>
            {/* Encabezado de la tabla */}
            <View style={styles.tableHeader1}>
              <Text style={[styles.tableHeaderText1, styles.idColumn]}>ID</Text>
              <Text style={[styles.tableHeaderText1, styles.claveColumn]}>
                Clave
              </Text>
              <Text style={[styles.tableHeaderText1, styles.nombreColumn]}>
                Nombre
              </Text>
              <Text style={[styles.tableHeaderText1, styles.costoColumn]}>
                Costo
              </Text>
              <View
                style={[styles.actionsColumn1, styles.headerActionsContainer]}
              >
                <Text style={styles.tableHeaderText1} numberOfLines={2}>
                  Acciones
                </Text>
              </View>
            </View>

            {/* Filas de la tabla */}
            <ScrollView style={styles.tableBody}>
              {recetasPaginadas.map((item) => (
                <View key={item.id} style={styles.tableRow1}>
                  <Text style={[styles.tableCellText1, styles.idColumn]}>
                    {item.id}
                  </Text>
                  <Text style={[styles.tableCellText1, styles.claveColumn]}>
                    {item.clave}
                  </Text>
                  <Text style={[styles.tableCellText1, styles.nombreColumn]}>
                    {item.nombre}
                  </Text>
                  <Text
                    style={[
                      styles.tableCellText1,
                      styles.costoColumn,
                      styles.costoText,
                    ]}
                  >
                    {formatCurrency(item.costo_receta)}
                  </Text>
                  <View
                    style={[styles.actionsColumn1, styles.actionsContainer]}
                  >
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(item)}
                    >
                      <Image
                        source={require("../../../../../assets/editarr.png")}
                        style={styles.iconI}
                        accessibilityLabel="Editar receta"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Mensajes si no hay resultados */}
            {recetasPaginadas.length === 0 && busquedaReceta.trim() !== "" && (
              <Text style={styles.emptyText}>
                No se encontraron recetas que coincidan con la búsqueda.
              </Text>
            )}
            {recetasPaginadas.length === 0 && busquedaReceta.trim() === "" && (
              <Text style={styles.emptyText}>
                No hay recetas{" "}
                {filtroEstado !== "todos" ? filtroEstado + "s" : ""}{" "}
                registradas.
              </Text>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <View style={styles.paginacionContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginacionBoton,
                    paginaActual === 1 && styles.paginacionBotonDisabled,
                  ]}
                  onPress={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  <Text style={styles.paginacionTexto}>←</Text>
                </TouchableOpacity>

                <View style={styles.paginacionNumeros}>
                  {[...Array(totalPaginas)].map((_, index) => {
                    const numeroPagina = index + 1;
                    if (
                      numeroPagina === 1 ||
                      numeroPagina === totalPaginas ||
                      (numeroPagina >= paginaActual - 1 &&
                        numeroPagina <= paginaActual + 1)
                    ) {
                      return (
                        <TouchableOpacity
                          key={numeroPagina}
                          style={[
                            styles.paginacionNumero,
                            paginaActual === numeroPagina &&
                            styles.paginacionNumeroActivo,
                          ]}
                          onPress={() => cambiarPagina(numeroPagina)}
                        >
                          <Text
                            style={[
                              styles.paginacionNumeroTexto,
                              paginaActual === numeroPagina &&
                              styles.paginacionNumeroTextoActivo,
                            ]}
                          >
                            {numeroPagina}
                          </Text>
                        </TouchableOpacity>
                      );
                    } else if (
                      numeroPagina === paginaActual - 2 ||
                      numeroPagina === paginaActual + 2
                    ) {
                      return (
                        <Text
                          key={numeroPagina}
                          style={styles.paginacionPuntos}
                        >
                          ...
                        </Text>
                      );
                    }
                    return null;
                  })}
                </View>

                <TouchableOpacity
                  style={[
                    styles.paginacionBoton,
                    paginaActual === totalPaginas &&
                    styles.paginacionBotonDisabled,
                  ]}
                  onPress={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  <Text style={styles.paginacionTexto}>→</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerFixed}>
            <Text style={styles.modalTitle}>
              {modalType === "crear" ? "Agregar" : "Editar"} Receta
            </Text>

            <ScrollView style={styles.scrollableContent}>
              <TextInput
                style={styles.input}
                placeholder="Clave"
                placeholderTextColor="#888"
                value={recetaData.clave || undefined}
                onChangeText={(text) => handleInputChange("clave", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={recetaData.nombre || undefined}
                onChangeText={(text) => handleInputChange("nombre", text)}
              />


              {/* Selector de estado */}
              <View style={styles.estadoSelectorContainer}>
                <Text style={styles.estadoSelectorLabel}>Estado:</Text>
                <View style={styles.estadoSelectorButtons}>
                  <TouchableOpacity
                    style={[
                      styles.estadoSelectorBoton,
                      recetaData.estado === "activo" &&
                      styles.estadoSelectorBotonActivo,
                    ]}
                    onPress={() => handleInputChange("estado", "activo")}
                  >
                    <Text
                      style={[
                        styles.estadoSelectorTexto,
                        recetaData.estado === "activo" &&
                        styles.estadoSelectorTextoActivo,
                      ]}
                    >
                      Activo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.estadoSelectorBoton,
                      recetaData.estado === "inactivo" &&
                      styles.estadoSelectorBotonActivo,
                    ]}
                    onPress={() => handleInputChange("estado", "inactivo")}
                  >
                    <Text
                      style={[
                        styles.estadoSelectorTexto,
                        recetaData.estado === "inactivo" &&
                        styles.estadoSelectorTextoActivo,
                      ]}
                    >
                      Inactivo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Advertencia si se va a desactivar */}
              {modalType === "editar" &&
                recetaData.estado === "inactivo" &&
                recetaDetalle?.estado === "activo" && (
                  <View style={styles.advertenciaContainer}>
                    <Text style={styles.advertenciaTexto}>
                      ⚠️ Al desactivar esta receta, el producto asociado también
                      se desactivará automáticamente.
                    </Text>
                  </View>
                )}

              {/* COSTO DE LA RECETA (SOLO EN EDICIÓN) */}
              {modalType === "editar" && recetaDetalle && (
                <View style={styles.costoRecetaContainer}>
                  <View style={styles.costoRow}>
                    <Text style={styles.costoLabel}>Costo de Receta:</Text>
                    <Text style={styles.costoValue}>
                      {formatCurrency(recetaDetalle.costo_receta)}
                    </Text>
                  </View>
                  <View style={styles.costoRow}>
                    <Text style={styles.costoLabel}>Costo Redondeado:</Text>
                    <Text style={styles.costoValue}>
                      {formatCurrency(recetaDetalle.costo_redondeado)}
                    </Text>
                  </View>
                </View>
              )}

              {/* MATERIAS PRIMAS ACTUALES */}
              {modalType === "editar" &&
                recetaDetalle?.materias_primas &&
                recetaDetalle.materias_primas.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      Materias Primas Actuales
                    </Text>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                        Materia Prima
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                        Cantidad
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                        Acciones
                      </Text>
                    </View>

                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {recetaDetalle.materias_primas.map((mp) => (
                        <View key={mp.id} style={styles.tableRow}>
                          <Text style={[styles.tableCellText, { flex: 2 }]}>
                            {mp.clave} - {mp.nombre}
                          </Text>
                          <View style={[{ flex: 1.5 }]}>
                            <View style={styles.cantidadContainer}>
                              <TextInput
                                style={[styles.input, styles.cantidadInput]}
                                value={String(mp.pivot.cantidad)}
                                keyboardType="decimal-pad"
                                onChangeText={(text) =>
                                  handleExistingMateriaPrimaChange(mp.id, text)
                                }
                              />
                              <Text style={styles.unidadText}>{mp.unidad}</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[styles.deleteButton, { flex: 1 }]}
                            onPress={() => removeExistingMateriaPrima(mp.id)}
                          >
                            <Image
                              source={require("../../../../../assets/eliminar.png")}
                              style={styles.icon}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

              {/* NUEVAS MATERIAS PRIMAS CON BUSCADOR */}
              <Text style={styles.sectionTitle}>
                {modalType === "editar"
                  ? "Agregar Nuevas Materias Primas"
                  : "Materias Primas"}
              </Text>

              <View style={{ maxHeight: 300 }}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {recetaData.materias_primas.map((mp, index) => (
                    <View key={index} style={styles.newRowContainer}>
                      <View style={styles.newRowLabels}>
                        <Text style={{ fontWeight: "bold", flex: 2 }}>
                          Materia Prima
                        </Text>
                        <Text style={{ fontWeight: "bold", flex: 1.5 }}>
                          Cantidad
                        </Text>
                      </View>

                      <View style={styles.newRowControls}>
                        <View style={styles.searchMateriaPrimaContainer}>
                          <TextInput
                            style={styles.searchMateriaPrimaInput}
                            placeholder="Buscar materia prima..."
                            value={mp.searchText || ""}
                            onChangeText={(text) => {
                              const updated = [...recetaData.materias_primas];
                              updated[index].searchText = text;
                              setRecetaData((prev) => ({
                                ...prev,
                                materias_primas: updated,
                              }));
                              setShowMateriaPrimaDropdown(index);
                            }}
                            onFocus={() => setShowMateriaPrimaDropdown(index)}
                          />

                          {showMateriaPrimaDropdown === index &&
                            mp.searchText && (
                              <View style={styles.dropdownContainer}>
                                <ScrollView
                                  style={styles.dropdownScroll}
                                  nestedScrollEnabled
                                >
                                  {getMateriasPrimasFiltradas(
                                    mp.searchText
                                  ).map((materiaPrima) => (
                                    <TouchableOpacity
                                      key={materiaPrima.id}
                                      style={styles.dropdownItem}
                                      onPress={() =>
                                        selectMateriaPrima(index, materiaPrima)
                                      }
                                    >
                                      <Text style={styles.dropdownItemText}>
                                        {materiaPrima.clave} -{" "}
                                        {materiaPrima.nombre}
                                      </Text>
                                      <Text style={styles.dropdownItemSubtext}>
                                        {materiaPrima.unidad} - $
                                        {materiaPrima.costo_unitario}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                  {getMateriasPrimasFiltradas(mp.searchText)
                                    .length === 0 && (
                                      <Text style={styles.dropdownEmpty}>
                                        No se encontraron materias primas
                                      </Text>
                                    )}
                                </ScrollView>
                              </View>
                            )}
                        </View>

                        <View style={styles.newCantidadWrapper}>
                          <TextInput
                            style={styles.newCantidadInput}
                            placeholder="Cantidad"
                            keyboardType="decimal-pad"
                            value={mp.cantidad}
                            onChangeText={(text) =>
                              handleMateriaPrimaChange(index, "cantidad", text)
                            }
                          />
                          <Text style={styles.newUnidadText}>
                            {getUnidadMateriaPrima(mp.materia_prima_id)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => removeMateriaPrima(index)}
                          style={styles.newDeleteButton}
                        >
                          <Image
                            source={require("../../../../../assets/eliminar.png")}
                            style={styles.icon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={addMateriaPrima}
              >
                <Image
                  source={require("../../../../../assets/agreg.png")}
                  style={styles.iconI}
                />
                <Text style={styles.addButtonText}>Agregar Materia Prima</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* BOTONES FIJOS */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading
                    ? modalType === "crear"
                      ? "Creando..."
                      : "Actualizando..."
                    : modalType === "crear"
                      ? "Crear"
                      : "Actualizar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  filtrosContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  buscadorInput: {
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 20,
    padding: 10,
    fontSize: 18,
    backgroundColor: "#ECFDF5",
  },
  filtroEstadoContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  filtroBoton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filtroBotonActivo: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filtroTexto: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  filtroTextoActivo: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  tableHeader1: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
  },
  tableHeaderText1: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333333",
    flexWrap: "wrap",
  },
  headerActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tableBody: {
    maxHeight: "100%",
  },
  tableRow1: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  tableCellText1: {
    fontSize: 14,
    color: "#444",
    flexWrap: "wrap",
  },
  idColumn: {
    flex: 0.5,
    textAlign: "center",
  },
  claveColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  nombreColumn: {
    flex: 2.5,
    paddingHorizontal: 4,
  },
  costoColumn: {
    flex: 1.2,
    paddingHorizontal: 4,
    textAlign: "right",
  },
  costoText: {
    fontWeight: "600",
    color: "#28a745",
  },
  actionsColumn1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  paginacionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 10,
  },
  paginacionBoton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  paginacionBotonDisabled: {
    backgroundColor: "#ccc",
  },
  paginacionTexto: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  paginacionNumeros: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  paginacionNumero: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  paginacionNumeroActivo: {
    backgroundColor: "#4CAF50",
  },
  paginacionNumeroTexto: {
    fontSize: 16,
    color: "#333",
  },
  paginacionNumeroTextoActivo: {
    color: "#fff",
    fontWeight: "bold",
  },
  paginacionPuntos: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainerFixed: {
    backgroundColor: "white",
    width: "90%",
    maxHeight: "90%",
    borderRadius: 10,
    padding: 16,
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  scrollableContent: {
    flexGrow: 1,
    marginBottom: 16,
  },
  estadoSelectorContainer: {
    marginBottom: 16,
  },
  estadoSelectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  estadoSelectorButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  estadoSelectorBoton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center",
  },
  estadoSelectorBotonActivo: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  estadoSelectorTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  estadoSelectorTextoActivo: {
    color: "#fff",
  },
  advertenciaContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  advertenciaTexto: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
  },
  costoRecetaContainer: {
    backgroundColor: "#f0f8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#28a745",
  },
  costoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  costoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  costoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
  },
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 11,
    marginBottom: 10,
    backgroundColor: "white",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  tableCellText: {
    fontSize: 14,
    textAlign: "center",
  },
  cantidadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cantidadInput: {
    flex: 1,
    marginRight: 0,
  },
  unidadText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "center",
  },
  newRowContainer: {
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  newRowLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  newRowControls: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  searchMateriaPrimaContainer: {
    flex: 2,
    marginRight: 12,
    position: "relative",
    zIndex: 1000,
  },
  searchMateriaPrimaInput: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  dropdownContainer: {
    position: "absolute",
    top: 45,
    left: 0,
    right: 0,
    maxHeight: 200,
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
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: "#666",
  },
  dropdownEmpty: {
    padding: 12,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },
  newCantidadWrapper: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  newCantidadInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  newUnidadText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  newDeleteButton: {
    padding: 6,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffaa29ff",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 17,
    color: "#ffffffff",
    textAlign: "center",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  iconI: {
    alignItems: "center",
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginRight: 2,
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
  },
});
