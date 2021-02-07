![Logo](admin/omron-fins.png)
# ioBroker.omron-fins

[![NPM version](http://img.shields.io/npm/v/iobroker.omron-fins.svg)](https://www.npmjs.com/package/iobroker.omron-fins)
[![Downloads](https://img.shields.io/npm/dm/iobroker.omron-fins.svg)](https://www.npmjs.com/package/iobroker.omron-fins)
![Number of Installations (latest)](http://iobroker.live/badges/omron-fins-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/omron-fins-stable.svg)
[![Dependency Status](https://img.shields.io/david/thebam1990/iobroker.omron-fins.svg)](https://david-dm.org/thebam1990/iobroker.omron-fins)
[![Known Vulnerabilities](https://snyk.io/test/github/thebam1990/ioBroker.omron-fins/badge.svg)](https://snyk.io/test/github/thebam1990/ioBroker.omron-fins)

[![NPM](https://nodei.co/npm/iobroker.omron-fins.png?downloads=true)](https://nodei.co/npm/iobroker.omron-fins/)

**Tests:** ![Test and Release](https://github.com/thebam1990/ioBroker.omron-fins/workflows/Test%20and%20Release/badge.svg)

## omron-fins adapter for ioBroker
Anbindung für Omron SPS mittels FINS Protokoll alle CJ2M oder auch CJ1M Modelle

 
 

## Benutzer anleitung (deutsch)

Im Tab Haupteinstellungen die IP Adresse der SPS anpassen. 
Der Port ist der standardt Port und brauch in der regel nicht angepasst werden. 
Der Poll wert ist in ms angegeben und besagt die zykliche abfrage der werte.

Im Tab Devices werden die abzuholenden Variablen eingetragen 
Mit dem + einfach eine neue hinzufügen und dann einen Frei wählbaren Namen vergeben Bitte jede Variable individell bennen und nicht gleich.
Im Bereich Variable die abzuholende Variable eintragen für Input oder Output Variablen CB0:00, CB0:01 CB100:00 usw. Hierbei zur Trennung immer Doppelpunkte verwenden. Für Merker funktioniert auch W31:00 usw. Ebenfalls können D1 werte usw. abgeholt werden. 
Im Reiter type den variablen Typ auswählen so wie er auch in der SPS hinterlegt ist.



## Changelog
<!--
 Placeholder for the next version (at the beginning of the line):
 ### __WORK IN PROGRESS__ ( - falls nicht benötigt löschen sonst klammern entfernen und nach dem - dein text schreiben )
-->

### 0.0.1-5 (2021-01-01)
* (Thebam) io-package angepasst

### 0.0.1-4 (2021-01-01)
* (Thebam) package json angepasst

### 0.0.1-3 (2021-01-01)
* (Thebam) adater checker anpassung

### 0.0.1-2 (2021-01-01)
* (Thebam) native objekt ip geändert


### 0.0.1-1 (2021-01-01)
* (Thebam) add GitHub Action

### 0.0.1
* (Thebam) initial release
Erste version zum Abholen und schreiben der variablen

## License
MIT License

Copyright (c) 2021 thebam 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.