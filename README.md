Project Overview
ScoutGuard är en webbaserad plattform för avancerad fotbollsanalys och samarbete inom scouting. Projektet fokuserar på att extrahera detaljerad spelarstatistik från externa datakällor, analysera spelarens påverkan på lagets defensiv genom linjär regression, och möjliggöra interaktivt samarbete inom scouting-teams.

Goals and Objectives
Automatisera extraktion och analys av detaljerade spelarstatistik från externa källor (t.ex. FBref).

Bygga regressionsmodeller för att identifiera nyckelaktioner som förbättrar lagets defensiva prestation (xGA – Expected Goals Against).

Skapa en intuitiv frontend med interaktiva visualiseringar av data och analysresultat.

Implementera funktioner för realtidskommunikation, interaktiva omröstningar, och beslutsstöd för scouting-team.

Core Functionalities

1. Data Extraction & Storage
   Automatisk web scraping från externa datakällor.

Säker och effektiv datalagring i Supabase.

2. Performance Analytics & Regression Modelling
   Bygga analysmatris från Supabase där varje rad representerar en spelares actions under en specifik match.

Träna en linjär regressionsmodell för att prediktera lagets defensiva prestation (xGA) baserat på spelares actions.

Identifiera och tolka de viktigaste regressionkoefficienterna.

De actions som har störst negativ påverkan på xGA definieras som nyckelfaktorer för defensiv framgång.

3. Interactive Collaboration
   Team-based Chat: Realtidschatt för lagmedlemmar kopplade till samma scouting-team.

Interactive Voting: Möjlighet att rösta på rekommenderade spelare och bygga konsensus kring beslutsfattande.

Collaboration Logs: Loggning av interaktioner och beslut för historisk analys.

Technology Stack
Frontend: React, TypeScript, Tailwind CSS, Vite

Backend: Python, Supabase (PostgreSQL)

Statistical Analysis: Python (pandas, scikit-learn, statsmodels)

Real-time Collaboration: Supabase Realtime, WebSockets

Data Scraping: Python (BeautifulSoup, requests, pandas)

Deliverables
Fullständig frontend-applikation med interaktiva analyser och kollaborationsfunktioner.

Backend med realtidskommunikation, regressionsanalys, och interaktivt beslutsstöd.

Automatiserade skript för scraping och regressionsanalys.

Dokumentation som beskriver användning och installation.
