import os
import pickle
import re
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder

MODEL_PATH = os.path.join(os.path.dirname(__file__), "severity_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "severity_encoder.pkl")
TFIDF_PATH = os.path.join(os.path.dirname(__file__), "severity_tfidf.pkl")

INCIDENT_TYPES = ["medical", "fire", "accident", "harassment", "flood", "blockage", "suspicious", "other"]
SEVERITY_CLASSES = ["low", "moderate", "high", "critical"]

CRITICAL_KEYWORDS = {
    "fire", "smoke", "explosion", "flame", "burning", "cardiac", "unconscious", "collapsed",
    "bleeding", "ambulance", "trapped", "weapon", "gun", "knife", "assault", "structural collapse",
    "hazmat", "poisoning", "electrocution", "severe", "emergency", "urgent", "evacuate"
}

HIGH_KEYWORDS = {
    "injury", "fracture", "blood", "fight", "harassment", "stalking", "waterlogging", "gas leak",
    "sparking", "spill", "hazard", "threat", "break-in", "theft", "attacker", "chasing", "injured"
}

LOW_KEYWORDS = {
    "minor", "dustbin", "lost", "found", "wifi", "light", "bulb", "maintenance", "dripping",
    "noise", "dirty", "trash", "delayed", "litter", "graffiti", "slip"
}


class SeverityPredictor:
    def __init__(self) -> None:
        self.model: Optional[RandomForestClassifier] = None
        self.encoder: Optional[OneHotEncoder] = None
        self.tfidf: Optional[TfidfVectorizer] = None
        self._loaded = False

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH) and os.path.exists(TFIDF_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                with open(ENCODER_PATH, "rb") as f:
                    self.encoder = pickle.load(f)
                with open(TFIDF_PATH, "rb") as f:
                    self.tfidf = pickle.load(f)
                self._loaded = True
                return
            except Exception:
                pass
        self.train_model()

    def _extract_text_signals(self, text: str) -> Tuple[float, float, float]:
        t = text.lower()
        crit_count = sum(1 for w in CRITICAL_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', t))
        high_count = sum(1 for w in HIGH_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', t))
        low_count = sum(1 for w in LOW_KEYWORDS if re.search(r'\b' + re.escape(w) + r'\b', t))
        return float(crit_count), float(high_count), float(low_count)

    def train_model(self, samples: Optional[List[Dict]] = None) -> None:
        """Train on synthetic realistic multi-modal data."""
        if samples is None:
            samples = self._generate_synthetic_data()

        texts = [s.get("description", "") for s in samples]
        self.tfidf = TfidfVectorizer(max_features=50, stop_words="english")
        tfidf_feats = self.tfidf.fit_transform(texts).toarray()

        self.encoder = OneHotEncoder(sparse_output=False, categories=[INCIDENT_TYPES])
        types_arr = np.array([[s["type"]] for s in samples])
        type_feats = self.encoder.fit_transform(types_arr)

        X_list = []
        y_list = []

        for i, s in enumerate(samples):
            crit, high, low = self._extract_text_signals(s.get("description", ""))
            num_feats = [
                s["hour_of_day"] / 23.0,
                s["day_of_week"] / 6.0,
                len(s.get("description", "")) / 500.0,
                float(s.get("has_location_name", False)),
                crit,
                high,
                low,
            ]
            row = np.hstack([type_feats[i], tfidf_feats[i], num_feats])
            X_list.append(row)
            y_list.append(SEVERITY_CLASSES.index(s["severity"]))

        X = np.array(X_list)
        y = np.array(y_list)

        self.model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        self.model.fit(X, y)
        self._loaded = True

        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        with open(ENCODER_PATH, "wb") as f:
            pickle.dump(self.encoder, f)
        with open(TFIDF_PATH, "wb") as f:
            pickle.dump(self.tfidf, f)

    def predict(
        self,
        incident_type: str,
        description: str = "",
        hour_of_day: int = 12,
        day_of_week: int = 2,
        has_location_name: bool = True,
    ) -> Dict[str, Any]:
        """Predict severity class, probability distribution, and reasoning factors."""
        self._ensure_loaded()

        norm_type = incident_type.lower()
        if norm_type not in INCIDENT_TYPES:
            norm_type = "other"

        type_encoded = self.encoder.transform([[norm_type]])
        tfidf_encoded = self.tfidf.transform([description]).toarray()
        crit, high, low = self._extract_text_signals(description)

        num_feats = [
            hour_of_day / 23.0,
            day_of_week / 6.0,
            len(description) / 500.0,
            float(has_location_name),
            crit,
            high,
            low,
        ]

        feature_vector = np.hstack([type_encoded[0], tfidf_encoded[0], num_feats]).reshape(1, -1)
        probabilities = self.model.predict_proba(feature_vector)[0]

        probs_dict = {cls: round(float(probabilities[i]), 4) for i, cls in enumerate(SEVERITY_CLASSES)}
        best_idx = int(np.argmax(probabilities))
        recommended_sev = SEVERITY_CLASSES[best_idx]
        confidence = round(float(probabilities[best_idx]), 3)

        # Generate explainable factors
        factors = []
        if crit > 0:
            factors.append("Detected critical urgency keywords (e.g. fire, emergency, collapse, unconscious)")
        elif high > 0:
            factors.append("Detected elevated safety threat keywords (e.g. injury, weapon, fight, spill)")
        elif low > 0:
            factors.append("Description contains low-impact/maintenance keywords")

        if norm_type in ("fire", "medical") and recommended_sev in ("critical", "high"):
            factors.append(f"Category '{norm_type.capitalize()}' carries high base urgency profile")
        elif norm_type in ("blockage", "other") and recommended_sev in ("low", "moderate"):
            factors.append(f"Category '{norm_type.capitalize()}' is typically low-risk unless specified")

        if hour_of_day >= 22 or hour_of_day <= 5:
            factors.append("Night-time report (elevated vulnerability factor)")

        if not factors:
            factors.append(f"Model inferred {recommended_sev} severity based on situational context and text length")

        return {
            "recommended_severity": recommended_sev,
            "confidence": confidence,
            "probabilities": probs_dict,
            "factors": factors,
        }

    def _generate_synthetic_data(self) -> List[Dict]:
        """Generate diverse synthetic dataset with realistic descriptions."""
        np.random.seed(42)
        samples: List[Dict] = []

        templates = {
            "fire": [
                ("Small fire in chemistry lab, heavy smoke billowing from windows", "critical"),
                ("Electrical sparking from main junction box with smoke", "high"),
                ("Burnt trash behind canteen creating smoke odor", "low"),
                ("Fire alarm ringing in library basement, evacuation underway", "critical"),
                ("Overheated microwave in staff room, minor smoke contained", "moderate"),
            ],
            "medical": [
                ("Student collapsed on ground, unconscious and not responding", "critical"),
                ("Severe bleeding from head injury near sports field", "critical"),
                ("Student twisted ankle during football match, able to sit", "low"),
                ("Suspected food poisoning, multiple students vomiting", "high"),
                ("Student feeling dizzy and dehydrated at library desk", "low"),
            ],
            "accident": [
                ("Major vehicle collision near main gate with injured cyclist", "critical"),
                ("Two scooters bumped in parking lot, scratched bumper no injuries", "low"),
                ("Student fell from stairs in academic block, leg fracture suspected", "high"),
                ("Bicycle slipped on wet pavement, minor scratches on knee", "low"),
                ("Delivery truck hit campus lamp post, pole leaning dangerously", "moderate"),
            ],
            "harassment": [
                ("Aggressive individual following student in dark alley", "critical"),
                ("Verbal dispute and shouting match between two groups", "moderate"),
                ("Suspicious stalking reported near women's hostel gate", "high"),
                ("Catcalling incident reported near bus stop", "moderate"),
            ],
            "flood": [
                ("Burst main water line, hallway flooded with 3 inches of water", "high"),
                ("AC condensation leaking on hallway floor, slippery tile", "low"),
                ("Basement storage completely submerged after heavy downpour", "high"),
                ("Sink overflowing in ground floor restroom", "low"),
            ],
            "blockage": [
                ("Fallen tree completely blocking main emergency vehicle access road", "high"),
                ("Construction debris partially narrowing side footpath", "low"),
                ("Broken gate restricting entry to north parking lot", "moderate"),
                ("Delivery boxes left in hallway corridor", "low"),
            ],
            "suspicious": [
                ("Unattended black backpack left near administrative entrance for 2 hours", "high"),
                ("Person trying door handles of locked cars in parking lot", "moderate"),
                ("Unauthorized individual seen scaling boundary fence at night", "critical"),
                ("Drones flying low over residential blocks after dark", "moderate"),
            ],
            "other": [
                ("Complete power blackout in academic block during evening classes", "moderate"),
                ("WiFi down across entire computer science building", "low"),
                ("Chemical odor near sewage drain", "moderate"),
                ("Broken glass bottle on sidewalk near cafeteria", "low"),
            ],
        }

        for _ in range(50):
            for itype, item_list in templates.items():
                for desc, sev in item_list:
                    hour = np.random.randint(0, 24)
                    day = np.random.randint(0, 7)
                    samples.append({
                        "type": itype,
                        "description": desc,
                        "hour_of_day": hour,
                        "day_of_week": day,
                        "has_location_name": bool(np.random.random() > 0.2),
                        "severity": sev,
                    })

        return samples


predictor = SeverityPredictor()

