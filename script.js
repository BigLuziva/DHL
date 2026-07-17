// ==========================
// FIREBASE CONFIG
// ==========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc
            } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDVXhoDdxP6UJZTqV76XOG7y5zPNFrhHz8",
    authDomain: "tracker-e616c.firebaseapp.com",
    projectId: "tracker-e616c",
    storageBucket: "tracker-e616c.firebasestorage.app",
    messagingSenderId: "609685980737",
    appId: "1:609685980737:web:0be7f51723ec1db777a8c0"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


// ==========================
// SUPABASE CONFIG
// ==========================
//const SUPABASE_URL = "https://hbfgzpkebogdcuabvlyb.supabase.co";
//const SUPABASE_KEY = "sb_publishable_-kFLyd8FwGKvE8kldnSwMg_DtOWHSm4";

//const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);



// ==========================
// MAP VARIABLES
// ==========================
let map, marker, routingControl;
let markersLayer;


// ==========================
// GPS PIN + RED DOT (FIXED)
// ==========================
const gpsIcon = L.divIcon({
    className: '',
    html: `
        <div style="position:relative; width:25px; height:41px;">
            
            <div style="
                position:absolute;
                bottom:-2px;
                left:50%;
                transform:translateX(-50%);
                width:12px;
                height:12px;
                background:red;
                border-radius:50%;
                box-shadow:0 0 8px red;
                animation: blink 1s infinite;
                z-index:1;
            "></div>

            <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
                 style="
                    position:absolute;
                    top:0;
                    left:0;
                    width:18px;
                    height:28px;
                    z-index:2;
                 ">
        </div>
    `,
    iconSize: [22, 38],
    iconAnchor: [12, 38]
});


// ==========================
// START + DEST ICONS
// ==========================
const startIcon = L.divIcon({
    html: '<div style="background:green;width:14px;height:14px;border-radius:50%;box-shadow:0 0 6px green;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const destIcon = L.divIcon({
    html: '<div style="background:blue;width:14px;height:14px;border-radius:50%;box-shadow:0 0 6px blue;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});


// ==========================
// GEOCODE ADDRESS
// ==========================
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    }

    return null;
}


// ==========================
// ADMIN SAVE
// ==========================
async function updatePackage() {

    const trackingNumber = document.getElementById("trackingNumber")?.value.trim();
    if (!trackingNumber) return alert("Tracking number required");

    const file = document.getElementById("image")?.files[0];
    let imageData = null;

    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            imageData = e.target.result;
            await saveData(trackingNumber, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        await saveData(trackingNumber, null);
    }
}


// ==========================
// SAVE DATA TO FIRESTORE
// ==========================
async function saveData(trackingNumber, imageData) {

    let currentLat = null;
    let currentLng = null;

    let currentLocation =
        document.getElementById("currentLocation")?.value.trim() || null;

    if (currentLocation) {

        const coords = await geocodeAddress(currentLocation);

        if (!coords) {
            alert("Invalid current location");
            return;
        }

        currentLat = coords.lat;
        currentLng = coords.lng;
    }

    const startLat = parseFloat(document.getElementById("startLat").value);
    const startLng = parseFloat(document.getElementById("startLng").value);

    const destLat = parseFloat(document.getElementById("destLat").value);
    const destLng = parseFloat(document.getElementById("destLng").value);

    if (
        isNaN(startLat) ||
        isNaN(startLng) ||
        isNaN(destLat) ||
        isNaN(destLng)
    ) {
        alert("Invalid coordinates");
        return;
    }

    const packageData = {

        trackingNumber,

        status: document.getElementById("status").value,

        customerName: document.getElementById("customerName").value,

        customerEmail: document.getElementById("customerEmail").value,

        customerPhone: document.getElementById("customerPhone").value,

        address: document.getElementById("address").value,

        item: document.getElementById("item").value,

        weight: parseFloat(document.getElementById("weight").value) || 0,

        manualProgress:
            parseInt(document.getElementById("manualProgress").value) || 0,

        startLat,
        startLng,

        destLat,
        destLng,

        currentLocation,

        currentLat,

        currentLng,

        manualArrival:
            document.getElementById("manualArrival").value,

        image: imageData

    };

    try {

        await setDoc(
            doc(db, "tracker", trackingNumber),
            packageData
        );

        alert("Package saved successfully!");

    } catch (err) {

        console.error(err);

        alert("Save failed.");

    }

}



// ==========================
// RETRIEVE FOR EDIT
// ==========================
async function loadPackageForEdit() {

    const trackingNumber = document.getElementById("trackingNumber")?.value.trim();
    if (!trackingNumber) return alert("Enter tracking number");

    const { data, error } = await supabaseClient
        .from("tracker")
        .select("*")
        .eq("trackingNumber", trackingNumber)
        .maybeSingle();

    if (error || !data) return alert("Not found");

    document.getElementById("status").value = data.status || "";
    document.getElementById("customerName").value = data.customerName || "";
    document.getElementById("customerEmail").value = data.customerEmail || "";
    document.getElementById("customerPhone").value = data.customerPhone || "";
    document.getElementById("address").value = data.address || "";
    document.getElementById("item").value = data.item || "";
    document.getElementById("weight").value = data.weight || "";
    document.getElementById("manualProgress").value = data.manualProgress || "";

    document.getElementById("startLat").value = data.startLat || "";
    document.getElementById("startLng").value = data.startLng || "";
    document.getElementById("destLat").value = data.destLat || "";
    document.getElementById("destLng").value = data.destLng || "";
    document.getElementById("currentLocation").value = data.currentLocation || "";

    document.getElementById("manualArrival").value = data.manualArrival || "";

    alert("Loaded for editing");
}


// ==========================
// DELETE
// ==========================
async function deletePackage() {

    const trackingNumber = document.getElementById("trackingNumber")?.value.trim();
    if (!trackingNumber) return alert("Tracking number required");

    const { error } = await supabaseClient
        .from("tracker")
        .delete()
        .eq("trackingNumber", trackingNumber);

    if (error) alert("Delete failed");
    else alert("Deleted");
}


// ==========================
// TRACK PACKAGE
// ==========================
async function trackItem() {

    const trackingNumber = document.getElementById("trackInput")?.value.trim();
    const result = document.getElementById("result");

    if (!trackingNumber) return result.innerText = "Enter tracking number";

    const { data, error } = await supabaseClient
        .from("tracker")
        .select("*")
        .eq("trackingNumber", trackingNumber)
        .maybeSingle();

    if (error || !data) {
        return result.innerText = "Tracking number not found.";
    }

    // 🔥 FORCE NUMBERS
    data.startLat = parseFloat(data.startLat);
    data.startLng = parseFloat(data.startLng);
    data.destLat = parseFloat(data.destLat);
    data.destLng = parseFloat(data.destLng);

    result.innerHTML = `
        <strong>Customer:</strong> ${data.customerName}<br>
        <strong>Email:</strong> ${data.customerEmail || "N/A"}<br>
        <strong>Phone:</strong> ${data.customerPhone || "N/A"}<br>
        <strong>Address:</strong> ${data.address || "N/A"}<br>
        <strong>Item:</strong> ${data.item}<br>
        <strong>Weight:</strong> ${data.weight} kg<br>
        <strong>Status:</strong> ${data.status}<br>
        ${data.image ? `<img src="${data.image}">` : ""}
    `;

    initMap(data.startLat, data.startLng);

    markersLayer.clearLayers();

    L.marker([data.startLat, data.startLng], { icon: startIcon }).addTo(markersLayer);
    L.marker([data.destLat, data.destLng], { icon: destIcon }).addTo(markersLayer);

    if (
        data.startLat === null || isNaN(data.startLat) ||
        data.destLat === null || isNaN(data.destLat)
    ) {
        return;
    }

    drawRoute(data);
}


// ==========================
// INIT MAP
// ==========================
function initMap(lat, lng) {
    if (!map) {
        map = L.map("map").setView([lat, lng], 6);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
    }
}


// ==========================
// DRAW ROUTE
// ==========================
function drawRoute(data) {

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(data.startLat, data.startLng),
            L.latLng(data.destLat, data.destLng)
        ],
        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false,
        createMarker: () => null,
        lineOptions: {
            styles: [{ color: "red", weight: 4 }]
        }
    }).addTo(map);

    // hide directions panel
    const container = routingControl.getContainer();
    if (container) container.style.display = "none";

    routingControl.on("routesfound", function (e) {

        const route = e.routes[0]; 
        const coords = e.routes[0].coordinates;

        // (Distance / ETA / Arrival)
        document.getElementById("distance").innerText =
            (route.summary.totalDistance / 1000).toFixed(2) + " km";

        document.getElementById("eta").innerText =
            Math.round(route.summary.totalTime / 60) + " minutes";

        document.getElementById("arrivalTime").innerText =
            data.manualArrival
                ? new Date(data.manualArrival).toLocaleString()
                : "-";

        if (marker) map.removeLayer(marker);

        marker = L.marker(coords[0], {
            icon: gpsIcon,
            zIndexOffset: 1000
        }).addTo(map);

        animateTruckAlongRoute(coords, data);
    });
}


// ==========================
// MOVE MARKER
// ==========================
function animateTruckAlongRoute(coords, data) {

    if (!marker || !coords.length) return;

    const progressBar = document.getElementById("progressBar");
    const progress = data.manualProgress || 0;

    let pos;

    if (data.currentLat && data.currentLng) {
        pos = {
            lat: parseFloat(data.currentLat),
            lng: parseFloat(data.currentLng)
        };
    } else {
        const index = Math.floor((progress / 100) * (coords.length - 1));
        pos = coords[index];
    }

    marker.setLatLng([pos.lat, pos.lng]);

    if (progressBar) {
        progressBar.style.width = progress + "%";
    }
}


//SLIDER
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slide");
    let currentSlide = 0;

    function showNextSlide() {
        slides[currentSlide].classList.remove("active");

        currentSlide = (currentSlide + 1) % slides.length;

        slides[currentSlide].classList.add("active");

    }

    setInterval(showNextSlide, 7000);
});


//the HTML onclick attributes

window.trackItem = trackItem;
window.updatePackage = updatePackage;
window.loadPackageForEdit = loadPackageForEdit;
window.deletePackage = deletePackage;