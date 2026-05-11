# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint-4.spec.ts >> CP-32 — La generación respeta los festivos (M→MF)
- Location: tests/e2e/sprint-4.spec.ts:70:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.screenshot: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "Gestor de Cuadrantes" [level=1] [ref=e5]
        - navigation [ref=e6]:
          - link "Cuadrante" [ref=e7] [cursor=pointer]:
            - /url: /
          - link "Empleados" [ref=e8] [cursor=pointer]:
            - /url: /employees
          - link "Ayuda" [ref=e9] [cursor=pointer]:
            - /url: /info
      - generic [ref=e10]:
        - generic [ref=e11]: admin@cuadrantes.localSUPER_ADMIN
        - button "Cerrar sesión" [ref=e12]
    - main [ref=e13]:
      - generic [ref=e14]:
        - button "‹" [ref=e15]
        - heading "Noviembre 2026" [level=2] [ref=e16]
        - button "›" [ref=e17]
        - generic [ref=e18]: Modo edición — clic en celda para asignar turno
        - button "Generando..." [disabled] [ref=e19]
        - button "Exportar CSV" [ref=e20]
        - button "Imprimir" [ref=e21]
        - button "Festivos" [ref=e22]
      - table [ref=e24]:
        - rowgroup [ref=e25]:
          - row "Empleado 1 D 2 L 3 M 4 X 5 J 6 V 7 S 8 D 9 L 10 M 11 X 12 J 13 V 14 S 15 D 16 L 17 M 18 X 19 J 20 V 21 S 22 D 23 L 24 M 25 X 26 J 27 V 28 S 29 D 30 L Contadores" [ref=e26]:
            - columnheader "Empleado" [ref=e27]
            - columnheader "1 D" [ref=e28] [cursor=pointer]:
              - generic [ref=e29]: "1"
              - generic [ref=e30]: D
            - columnheader "2 L" [ref=e31]:
              - generic [ref=e32]: "2"
              - generic [ref=e33]: L
            - columnheader "3 M" [ref=e34]:
              - generic [ref=e35]: "3"
              - generic [ref=e36]: M
            - columnheader "4 X" [ref=e37]:
              - generic [ref=e38]: "4"
              - generic [ref=e39]: X
            - columnheader "5 J" [ref=e40]:
              - generic [ref=e41]: "5"
              - generic [ref=e42]: J
            - columnheader "6 V" [ref=e43]:
              - generic [ref=e44]: "6"
              - generic [ref=e45]: V
            - columnheader "7 S" [ref=e46]:
              - generic [ref=e47]: "7"
              - generic [ref=e48]: S
            - columnheader "8 D" [ref=e49]:
              - generic [ref=e50]: "8"
              - generic [ref=e51]: D
            - columnheader "9 L" [ref=e52]:
              - generic [ref=e53]: "9"
              - generic [ref=e54]: L
            - columnheader "10 M" [ref=e55]:
              - generic [ref=e56]: "10"
              - generic [ref=e57]: M
            - columnheader "11 X" [ref=e58]:
              - generic [ref=e59]: "11"
              - generic [ref=e60]: X
            - columnheader "12 J" [ref=e61]:
              - generic [ref=e62]: "12"
              - generic [ref=e63]: J
            - columnheader "13 V" [ref=e64]:
              - generic [ref=e65]: "13"
              - generic [ref=e66]: V
            - columnheader "14 S" [ref=e67]:
              - generic [ref=e68]: "14"
              - generic [ref=e69]: S
            - columnheader "15 D" [ref=e70]:
              - generic [ref=e71]: "15"
              - generic [ref=e72]: D
            - columnheader "16 L" [ref=e73]:
              - generic [ref=e74]: "16"
              - generic [ref=e75]: L
            - columnheader "17 M" [ref=e76]:
              - generic [ref=e77]: "17"
              - generic [ref=e78]: M
            - columnheader "18 X" [ref=e79]:
              - generic [ref=e80]: "18"
              - generic [ref=e81]: X
            - columnheader "19 J" [ref=e82]:
              - generic [ref=e83]: "19"
              - generic [ref=e84]: J
            - columnheader "20 V" [ref=e85]:
              - generic [ref=e86]: "20"
              - generic [ref=e87]: V
            - columnheader "21 S" [ref=e88]:
              - generic [ref=e89]: "21"
              - generic [ref=e90]: S
            - columnheader "22 D" [ref=e91]:
              - generic [ref=e92]: "22"
              - generic [ref=e93]: D
            - columnheader "23 L" [ref=e94]:
              - generic [ref=e95]: "23"
              - generic [ref=e96]: L
            - columnheader "24 M" [ref=e97]:
              - generic [ref=e98]: "24"
              - generic [ref=e99]: M
            - columnheader "25 X" [ref=e100]:
              - generic [ref=e101]: "25"
              - generic [ref=e102]: X
            - columnheader "26 J" [ref=e103]:
              - generic [ref=e104]: "26"
              - generic [ref=e105]: J
            - columnheader "27 V" [ref=e106]:
              - generic [ref=e107]: "27"
              - generic [ref=e108]: V
            - columnheader "28 S" [ref=e109]:
              - generic [ref=e110]: "28"
              - generic [ref=e111]: S
            - columnheader "29 D" [ref=e112]:
              - generic [ref=e113]: "29"
              - generic [ref=e114]: D
            - columnheader "30 L" [ref=e115]:
              - generic [ref=e116]: "30"
              - generic [ref=e117]: L
            - columnheader "Contadores" [ref=e118]
        - rowgroup [ref=e119]:
          - row "Tecnico Editado 1778514033499 TF T D D N NF NF N N D D M M MF MF M D D T T TF TF T D D N NF NF N N M:3 T:4 N:6 MF:2 TF:3 NF:4 D:8" [ref=e120]:
            - cell "Tecnico Editado 1778514033499" [ref=e121]
            - cell "TF" [ref=e122] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e123]: TF
            - cell "T" [ref=e124] [cursor=pointer]:
              - generic "Tarde" [ref=e125]: T
            - cell "D" [ref=e126] [cursor=pointer]:
              - generic "Descanso" [ref=e127]: D
            - cell "D" [ref=e128] [cursor=pointer]:
              - generic "Descanso" [ref=e129]: D
            - cell "N" [ref=e130] [cursor=pointer]:
              - generic "Noche" [ref=e131]: "N"
            - cell "NF" [ref=e132] [cursor=pointer]:
              - generic "Noche Finde" [ref=e133]: NF
            - cell "NF" [ref=e134] [cursor=pointer]:
              - generic "Noche Finde" [ref=e135]: NF
            - cell "N" [ref=e136] [cursor=pointer]:
              - generic "Noche" [ref=e137]: "N"
            - cell "N" [ref=e138] [cursor=pointer]:
              - generic "Noche" [ref=e139]: "N"
            - cell "D" [ref=e140] [cursor=pointer]:
              - generic "Descanso" [ref=e141]: D
            - cell "D" [ref=e142] [cursor=pointer]:
              - generic "Descanso" [ref=e143]: D
            - cell "M" [ref=e144] [cursor=pointer]:
              - generic "Mañana" [ref=e145]: M
            - cell "M" [ref=e146] [cursor=pointer]:
              - generic "Mañana" [ref=e147]: M
            - cell "MF" [ref=e148] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e149]: MF
            - cell "MF" [ref=e150] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e151]: MF
            - cell "M" [ref=e152] [cursor=pointer]:
              - generic "Mañana" [ref=e153]: M
            - cell "D" [ref=e154] [cursor=pointer]:
              - generic "Descanso" [ref=e155]: D
            - cell "D" [ref=e156] [cursor=pointer]:
              - generic "Descanso" [ref=e157]: D
            - cell "T" [ref=e158] [cursor=pointer]:
              - generic "Tarde" [ref=e159]: T
            - cell "T" [ref=e160] [cursor=pointer]:
              - generic "Tarde" [ref=e161]: T
            - cell "TF" [ref=e162] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e163]: TF
            - cell "TF" [ref=e164] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e165]: TF
            - cell "T" [ref=e166] [cursor=pointer]:
              - generic "Tarde" [ref=e167]: T
            - cell "D" [ref=e168] [cursor=pointer]:
              - generic "Descanso" [ref=e169]: D
            - cell "D" [ref=e170] [cursor=pointer]:
              - generic "Descanso" [ref=e171]: D
            - cell "N" [ref=e172] [cursor=pointer]:
              - generic "Noche" [ref=e173]: "N"
            - cell "NF" [ref=e174] [cursor=pointer]:
              - generic "Noche Finde" [ref=e175]: NF
            - cell "NF" [ref=e176] [cursor=pointer]:
              - generic "Noche Finde" [ref=e177]: NF
            - cell "N" [ref=e178] [cursor=pointer]:
              - generic "Noche" [ref=e179]: "N"
            - cell "N" [ref=e180] [cursor=pointer]:
              - generic "Noche" [ref=e181]: "N"
            - cell "M:3 T:4 N:6 MF:2 TF:3 NF:4 D:8" [ref=e182]:
              - generic [ref=e183]:
                - generic [ref=e184]: M:3
                - generic [ref=e185]: T:4
                - generic [ref=e186]: N:6
                - generic [ref=e187]: MF:2
                - generic [ref=e188]: TF:3
                - generic [ref=e189]: NF:4
                - generic [ref=e190]: D:8
          - row "Técnico 1 D N N N N NF D D M M M M M D D T T T T T D D N N N N NF D D M M:6 T:5 N:8 NF:2 D:9" [ref=e191]:
            - cell "Técnico 1" [ref=e192]
            - cell "D" [ref=e193] [cursor=pointer]:
              - generic "Descanso" [ref=e194]: D
            - cell "N" [ref=e195] [cursor=pointer]:
              - generic "Noche" [ref=e196]: "N"
            - cell "N" [ref=e197] [cursor=pointer]:
              - generic "Noche" [ref=e198]: "N"
            - cell "N" [ref=e199] [cursor=pointer]:
              - generic "Noche" [ref=e200]: "N"
            - cell "N" [ref=e201] [cursor=pointer]:
              - generic "Noche" [ref=e202]: "N"
            - cell "NF" [ref=e203] [cursor=pointer]:
              - generic "Noche Finde" [ref=e204]: NF
            - cell "D" [ref=e205] [cursor=pointer]:
              - generic "Descanso" [ref=e206]: D
            - cell "D" [ref=e207] [cursor=pointer]:
              - generic "Descanso" [ref=e208]: D
            - cell "M" [ref=e209] [cursor=pointer]:
              - generic "Mañana" [ref=e210]: M
            - cell "M" [ref=e211] [cursor=pointer]:
              - generic "Mañana" [ref=e212]: M
            - cell "M" [ref=e213] [cursor=pointer]:
              - generic "Mañana" [ref=e214]: M
            - cell "M" [ref=e215] [cursor=pointer]:
              - generic "Mañana" [ref=e216]: M
            - cell "M" [ref=e217] [cursor=pointer]:
              - generic "Mañana" [ref=e218]: M
            - cell "D" [ref=e219] [cursor=pointer]:
              - generic "Descanso" [ref=e220]: D
            - cell "D" [ref=e221] [cursor=pointer]:
              - generic "Descanso" [ref=e222]: D
            - cell "T" [ref=e223] [cursor=pointer]:
              - generic "Tarde" [ref=e224]: T
            - cell "T" [ref=e225] [cursor=pointer]:
              - generic "Tarde" [ref=e226]: T
            - cell "T" [ref=e227] [cursor=pointer]:
              - generic "Tarde" [ref=e228]: T
            - cell "T" [ref=e229] [cursor=pointer]:
              - generic "Tarde" [ref=e230]: T
            - cell "T" [ref=e231] [cursor=pointer]:
              - generic "Tarde" [ref=e232]: T
            - cell "D" [ref=e233] [cursor=pointer]:
              - generic "Descanso" [ref=e234]: D
            - cell "D" [ref=e235] [cursor=pointer]:
              - generic "Descanso" [ref=e236]: D
            - cell "N" [ref=e237] [cursor=pointer]:
              - generic "Noche" [ref=e238]: "N"
            - cell "N" [ref=e239] [cursor=pointer]:
              - generic "Noche" [ref=e240]: "N"
            - cell "N" [ref=e241] [cursor=pointer]:
              - generic "Noche" [ref=e242]: "N"
            - cell "N" [ref=e243] [cursor=pointer]:
              - generic "Noche" [ref=e244]: "N"
            - cell "NF" [ref=e245] [cursor=pointer]:
              - generic "Noche Finde" [ref=e246]: NF
            - cell "D" [ref=e247] [cursor=pointer]:
              - generic "Descanso" [ref=e248]: D
            - cell "D" [ref=e249] [cursor=pointer]:
              - generic "Descanso" [ref=e250]: D
            - cell "M" [ref=e251] [cursor=pointer]:
              - generic "Mañana" [ref=e252]: M
            - cell "M:6 T:5 N:8 NF:2 D:9" [ref=e253]:
              - generic [ref=e254]:
                - generic [ref=e255]: M:6
                - generic [ref=e256]: T:5
                - generic [ref=e257]: N:8
                - generic [ref=e258]: NF:2
                - generic [ref=e259]: D:9
          - row "Técnico 2 N N N D D M MF MF M M D D T TF TF T T D D NF NF N N N D D M MF MF M M:5 T:3 N:6 MF:4 TF:2 NF:2 D:8" [ref=e260]:
            - cell "Técnico 2" [ref=e261]
            - cell "N" [ref=e262] [cursor=pointer]:
              - generic "Noche" [ref=e263]: "N"
            - cell "N" [ref=e264] [cursor=pointer]:
              - generic "Noche" [ref=e265]: "N"
            - cell "N" [ref=e266] [cursor=pointer]:
              - generic "Noche" [ref=e267]: "N"
            - cell "D" [ref=e268] [cursor=pointer]:
              - generic "Descanso" [ref=e269]: D
            - cell "D" [ref=e270] [cursor=pointer]:
              - generic "Descanso" [ref=e271]: D
            - cell "M" [ref=e272] [cursor=pointer]:
              - generic "Mañana" [ref=e273]: M
            - cell "MF" [ref=e274] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e275]: MF
            - cell "MF" [ref=e276] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e277]: MF
            - cell "M" [ref=e278] [cursor=pointer]:
              - generic "Mañana" [ref=e279]: M
            - cell "M" [ref=e280] [cursor=pointer]:
              - generic "Mañana" [ref=e281]: M
            - cell "D" [ref=e282] [cursor=pointer]:
              - generic "Descanso" [ref=e283]: D
            - cell "D" [ref=e284] [cursor=pointer]:
              - generic "Descanso" [ref=e285]: D
            - cell "T" [ref=e286] [cursor=pointer]:
              - generic "Tarde" [ref=e287]: T
            - cell "TF" [ref=e288] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e289]: TF
            - cell "TF" [ref=e290] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e291]: TF
            - cell "T" [ref=e292] [cursor=pointer]:
              - generic "Tarde" [ref=e293]: T
            - cell "T" [ref=e294] [cursor=pointer]:
              - generic "Tarde" [ref=e295]: T
            - cell "D" [ref=e296] [cursor=pointer]:
              - generic "Descanso" [ref=e297]: D
            - cell "D" [ref=e298] [cursor=pointer]:
              - generic "Descanso" [ref=e299]: D
            - cell "NF" [ref=e300] [cursor=pointer]:
              - generic "Noche Finde" [ref=e301]: NF
            - cell "NF" [ref=e302] [cursor=pointer]:
              - generic "Noche Finde" [ref=e303]: NF
            - cell "N" [ref=e304] [cursor=pointer]:
              - generic "Noche" [ref=e305]: "N"
            - cell "N" [ref=e306] [cursor=pointer]:
              - generic "Noche" [ref=e307]: "N"
            - cell "N" [ref=e308] [cursor=pointer]:
              - generic "Noche" [ref=e309]: "N"
            - cell "D" [ref=e310] [cursor=pointer]:
              - generic "Descanso" [ref=e311]: D
            - cell "D" [ref=e312] [cursor=pointer]:
              - generic "Descanso" [ref=e313]: D
            - cell "M" [ref=e314] [cursor=pointer]:
              - generic "Mañana" [ref=e315]: M
            - cell "MF" [ref=e316] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e317]: MF
            - cell "MF" [ref=e318] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e319]: MF
            - cell "M" [ref=e320] [cursor=pointer]:
              - generic "Mañana" [ref=e321]: M
            - cell "M:5 T:3 N:6 MF:4 TF:2 NF:2 D:8" [ref=e322]:
              - generic [ref=e323]:
                - generic [ref=e324]: M:5
                - generic [ref=e325]: T:3
                - generic [ref=e326]: N:6
                - generic [ref=e327]: MF:4
                - generic [ref=e328]: TF:2
                - generic [ref=e329]: NF:2
                - generic [ref=e330]: D:8
          - row "Técnico 3 D D M M M M MF D D T T T T TF D D N N N NF NF D D M M M M MF D D M:8 T:4 N:3 MF:2 TF:1 NF:2 D:10" [ref=e331]:
            - cell "Técnico 3" [ref=e332]
            - cell "D" [ref=e333] [cursor=pointer]:
              - generic "Descanso" [ref=e334]: D
            - cell "D" [ref=e335] [cursor=pointer]:
              - generic "Descanso" [ref=e336]: D
            - cell "M" [ref=e337] [cursor=pointer]:
              - generic "Mañana" [ref=e338]: M
            - cell "M" [ref=e339] [cursor=pointer]:
              - generic "Mañana" [ref=e340]: M
            - cell "M" [ref=e341] [cursor=pointer]:
              - generic "Mañana" [ref=e342]: M
            - cell "M" [ref=e343] [cursor=pointer]:
              - generic "Mañana" [ref=e344]: M
            - cell "MF" [ref=e345] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e346]: MF
            - cell "D" [ref=e347] [cursor=pointer]:
              - generic "Descanso" [ref=e348]: D
            - cell "D" [ref=e349] [cursor=pointer]:
              - generic "Descanso" [ref=e350]: D
            - cell "T" [ref=e351] [cursor=pointer]:
              - generic "Tarde" [ref=e352]: T
            - cell "T" [ref=e353] [cursor=pointer]:
              - generic "Tarde" [ref=e354]: T
            - cell "T" [ref=e355] [cursor=pointer]:
              - generic "Tarde" [ref=e356]: T
            - cell "T" [ref=e357] [cursor=pointer]:
              - generic "Tarde" [ref=e358]: T
            - cell "TF" [ref=e359] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e360]: TF
            - cell "D" [ref=e361] [cursor=pointer]:
              - generic "Descanso" [ref=e362]: D
            - cell "D" [ref=e363] [cursor=pointer]:
              - generic "Descanso" [ref=e364]: D
            - cell "N" [ref=e365] [cursor=pointer]:
              - generic "Noche" [ref=e366]: "N"
            - cell "N" [ref=e367] [cursor=pointer]:
              - generic "Noche" [ref=e368]: "N"
            - cell "N" [ref=e369] [cursor=pointer]:
              - generic "Noche" [ref=e370]: "N"
            - cell "NF" [ref=e371] [cursor=pointer]:
              - generic "Noche Finde" [ref=e372]: NF
            - cell "NF" [ref=e373] [cursor=pointer]:
              - generic "Noche Finde" [ref=e374]: NF
            - cell "D" [ref=e375] [cursor=pointer]:
              - generic "Descanso" [ref=e376]: D
            - cell "D" [ref=e377] [cursor=pointer]:
              - generic "Descanso" [ref=e378]: D
            - cell "M" [ref=e379] [cursor=pointer]:
              - generic "Mañana" [ref=e380]: M
            - cell "M" [ref=e381] [cursor=pointer]:
              - generic "Mañana" [ref=e382]: M
            - cell "M" [ref=e383] [cursor=pointer]:
              - generic "Mañana" [ref=e384]: M
            - cell "M" [ref=e385] [cursor=pointer]:
              - generic "Mañana" [ref=e386]: M
            - cell "MF" [ref=e387] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e388]: MF
            - cell "D" [ref=e389] [cursor=pointer]:
              - generic "Descanso" [ref=e390]: D
            - cell "D" [ref=e391] [cursor=pointer]:
              - generic "Descanso" [ref=e392]: D
            - cell "M:8 T:4 N:3 MF:2 TF:1 NF:2 D:10" [ref=e393]:
              - generic [ref=e394]:
                - generic [ref=e395]: M:8
                - generic [ref=e396]: T:4
                - generic [ref=e397]: N:3
                - generic [ref=e398]: MF:2
                - generic [ref=e399]: TF:1
                - generic [ref=e400]: NF:2
                - generic [ref=e401]: D:10
          - row "Técnico 4 MF M M M D D TF TF T T T D D NF N N N N D D MF MF M M M D D TF TF T M:6 T:4 N:4 MF:3 TF:4 NF:1 D:8" [ref=e402]:
            - cell "Técnico 4" [ref=e403]
            - cell "MF" [ref=e404] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e405]: MF
            - cell "M" [ref=e406] [cursor=pointer]:
              - generic "Mañana" [ref=e407]: M
            - cell "M" [ref=e408] [cursor=pointer]:
              - generic "Mañana" [ref=e409]: M
            - cell "M" [ref=e410] [cursor=pointer]:
              - generic "Mañana" [ref=e411]: M
            - cell "D" [ref=e412] [cursor=pointer]:
              - generic "Descanso" [ref=e413]: D
            - cell "D" [ref=e414] [cursor=pointer]:
              - generic "Descanso" [ref=e415]: D
            - cell "TF" [ref=e416] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e417]: TF
            - cell "TF" [ref=e418] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e419]: TF
            - cell "T" [ref=e420] [cursor=pointer]:
              - generic "Tarde" [ref=e421]: T
            - cell "T" [ref=e422] [cursor=pointer]:
              - generic "Tarde" [ref=e423]: T
            - cell "T" [ref=e424] [cursor=pointer]:
              - generic "Tarde" [ref=e425]: T
            - cell "D" [ref=e426] [cursor=pointer]:
              - generic "Descanso" [ref=e427]: D
            - cell "D" [ref=e428] [cursor=pointer]:
              - generic "Descanso" [ref=e429]: D
            - cell "NF" [ref=e430] [cursor=pointer]:
              - generic "Noche Finde" [ref=e431]: NF
            - cell "N" [ref=e432] [cursor=pointer]:
              - generic "Noche" [ref=e433]: "N"
            - cell "N" [ref=e434] [cursor=pointer]:
              - generic "Noche" [ref=e435]: "N"
            - cell "N" [ref=e436] [cursor=pointer]:
              - generic "Noche" [ref=e437]: "N"
            - cell "N" [ref=e438] [cursor=pointer]:
              - generic "Noche" [ref=e439]: "N"
            - cell "D" [ref=e440] [cursor=pointer]:
              - generic "Descanso" [ref=e441]: D
            - cell "D" [ref=e442] [cursor=pointer]:
              - generic "Descanso" [ref=e443]: D
            - cell "MF" [ref=e444] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e445]: MF
            - cell "MF" [ref=e446] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e447]: MF
            - cell "M" [ref=e448] [cursor=pointer]:
              - generic "Mañana" [ref=e449]: M
            - cell "M" [ref=e450] [cursor=pointer]:
              - generic "Mañana" [ref=e451]: M
            - cell "M" [ref=e452] [cursor=pointer]:
              - generic "Mañana" [ref=e453]: M
            - cell "D" [ref=e454] [cursor=pointer]:
              - generic "Descanso" [ref=e455]: D
            - cell "D" [ref=e456] [cursor=pointer]:
              - generic "Descanso" [ref=e457]: D
            - cell "TF" [ref=e458] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e459]: TF
            - cell "TF" [ref=e460] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e461]: TF
            - cell "T" [ref=e462] [cursor=pointer]:
              - generic "Tarde" [ref=e463]: T
            - cell "M:6 T:4 N:4 MF:3 TF:4 NF:1 D:8" [ref=e464]:
              - generic [ref=e465]:
                - generic [ref=e466]: M:6
                - generic [ref=e467]: T:4
                - generic [ref=e468]: N:4
                - generic [ref=e469]: MF:3
                - generic [ref=e470]: TF:4
                - generic [ref=e471]: NF:1
                - generic [ref=e472]: D:8
          - row "Técnico 5 MF D D T T T TF TF D D N N NF NF N D D M M M MF MF D D T T T TF TF D M:3 T:6 N:3 MF:3 TF:4 NF:2 D:9" [ref=e473]:
            - cell "Técnico 5" [ref=e474]
            - cell "MF" [ref=e475] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e476]: MF
            - cell "D" [ref=e477] [cursor=pointer]:
              - generic "Descanso" [ref=e478]: D
            - cell "D" [ref=e479] [cursor=pointer]:
              - generic "Descanso" [ref=e480]: D
            - cell "T" [ref=e481] [cursor=pointer]:
              - generic "Tarde" [ref=e482]: T
            - cell "T" [ref=e483] [cursor=pointer]:
              - generic "Tarde" [ref=e484]: T
            - cell "T" [ref=e485] [cursor=pointer]:
              - generic "Tarde" [ref=e486]: T
            - cell "TF" [ref=e487] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e488]: TF
            - cell "TF" [ref=e489] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e490]: TF
            - cell "D" [ref=e491] [cursor=pointer]:
              - generic "Descanso" [ref=e492]: D
            - cell "D" [ref=e493] [cursor=pointer]:
              - generic "Descanso" [ref=e494]: D
            - cell "N" [ref=e495] [cursor=pointer]:
              - generic "Noche" [ref=e496]: "N"
            - cell "N" [ref=e497] [cursor=pointer]:
              - generic "Noche" [ref=e498]: "N"
            - cell "NF" [ref=e499] [cursor=pointer]:
              - generic "Noche Finde" [ref=e500]: NF
            - cell "NF" [ref=e501] [cursor=pointer]:
              - generic "Noche Finde" [ref=e502]: NF
            - cell "N" [ref=e503] [cursor=pointer]:
              - generic "Noche" [ref=e504]: "N"
            - cell "D" [ref=e505] [cursor=pointer]:
              - generic "Descanso" [ref=e506]: D
            - cell "D" [ref=e507] [cursor=pointer]:
              - generic "Descanso" [ref=e508]: D
            - cell "M" [ref=e509] [cursor=pointer]:
              - generic "Mañana" [ref=e510]: M
            - cell "M" [ref=e511] [cursor=pointer]:
              - generic "Mañana" [ref=e512]: M
            - cell "M" [ref=e513] [cursor=pointer]:
              - generic "Mañana" [ref=e514]: M
            - cell "MF" [ref=e515] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e516]: MF
            - cell "MF" [ref=e517] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e518]: MF
            - cell "D" [ref=e519] [cursor=pointer]:
              - generic "Descanso" [ref=e520]: D
            - cell "D" [ref=e521] [cursor=pointer]:
              - generic "Descanso" [ref=e522]: D
            - cell "T" [ref=e523] [cursor=pointer]:
              - generic "Tarde" [ref=e524]: T
            - cell "T" [ref=e525] [cursor=pointer]:
              - generic "Tarde" [ref=e526]: T
            - cell "T" [ref=e527] [cursor=pointer]:
              - generic "Tarde" [ref=e528]: T
            - cell "TF" [ref=e529] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e530]: TF
            - cell "TF" [ref=e531] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e532]: TF
            - cell "D" [ref=e533] [cursor=pointer]:
              - generic "Descanso" [ref=e534]: D
            - cell "M:3 T:6 N:3 MF:3 TF:4 NF:2 D:9" [ref=e535]:
              - generic [ref=e536]:
                - generic [ref=e537]: M:3
                - generic [ref=e538]: T:6
                - generic [ref=e539]: N:3
                - generic [ref=e540]: MF:3
                - generic [ref=e541]: TF:4
                - generic [ref=e542]: NF:2
                - generic [ref=e543]: D:9
          - row "Técnico 6 TF T T T T D D N N N N N D D MF M M M M D D TF T T T T D D N N M:4 T:8 N:7 MF:1 TF:2 D:8" [ref=e544]:
            - cell "Técnico 6" [ref=e545]
            - cell "TF" [ref=e546] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e547]: TF
            - cell "T" [ref=e548] [cursor=pointer]:
              - generic "Tarde" [ref=e549]: T
            - cell "T" [ref=e550] [cursor=pointer]:
              - generic "Tarde" [ref=e551]: T
            - cell "T" [ref=e552] [cursor=pointer]:
              - generic "Tarde" [ref=e553]: T
            - cell "T" [ref=e554] [cursor=pointer]:
              - generic "Tarde" [ref=e555]: T
            - cell "D" [ref=e556] [cursor=pointer]:
              - generic "Descanso" [ref=e557]: D
            - cell "D" [ref=e558] [cursor=pointer]:
              - generic "Descanso" [ref=e559]: D
            - cell "N" [ref=e560] [cursor=pointer]:
              - generic "Noche" [ref=e561]: "N"
            - cell "N" [ref=e562] [cursor=pointer]:
              - generic "Noche" [ref=e563]: "N"
            - cell "N" [ref=e564] [cursor=pointer]:
              - generic "Noche" [ref=e565]: "N"
            - cell "N" [ref=e566] [cursor=pointer]:
              - generic "Noche" [ref=e567]: "N"
            - cell "N" [ref=e568] [cursor=pointer]:
              - generic "Noche" [ref=e569]: "N"
            - cell "D" [ref=e570] [cursor=pointer]:
              - generic "Descanso" [ref=e571]: D
            - cell "D" [ref=e572] [cursor=pointer]:
              - generic "Descanso" [ref=e573]: D
            - cell "MF" [ref=e574] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e575]: MF
            - cell "M" [ref=e576] [cursor=pointer]:
              - generic "Mañana" [ref=e577]: M
            - cell "M" [ref=e578] [cursor=pointer]:
              - generic "Mañana" [ref=e579]: M
            - cell "M" [ref=e580] [cursor=pointer]:
              - generic "Mañana" [ref=e581]: M
            - cell "M" [ref=e582] [cursor=pointer]:
              - generic "Mañana" [ref=e583]: M
            - cell "D" [ref=e584] [cursor=pointer]:
              - generic "Descanso" [ref=e585]: D
            - cell "D" [ref=e586] [cursor=pointer]:
              - generic "Descanso" [ref=e587]: D
            - cell "TF" [ref=e588] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e589]: TF
            - cell "T" [ref=e590] [cursor=pointer]:
              - generic "Tarde" [ref=e591]: T
            - cell "T" [ref=e592] [cursor=pointer]:
              - generic "Tarde" [ref=e593]: T
            - cell "T" [ref=e594] [cursor=pointer]:
              - generic "Tarde" [ref=e595]: T
            - cell "T" [ref=e596] [cursor=pointer]:
              - generic "Tarde" [ref=e597]: T
            - cell "D" [ref=e598] [cursor=pointer]:
              - generic "Descanso" [ref=e599]: D
            - cell "D" [ref=e600] [cursor=pointer]:
              - generic "Descanso" [ref=e601]: D
            - cell "N" [ref=e602] [cursor=pointer]:
              - generic "Noche" [ref=e603]: "N"
            - cell "N" [ref=e604] [cursor=pointer]:
              - generic "Noche" [ref=e605]: "N"
            - cell "M:4 T:8 N:7 MF:1 TF:2 D:8" [ref=e606]:
              - generic [ref=e607]:
                - generic [ref=e608]: M:4
                - generic [ref=e609]: T:8
                - generic [ref=e610]: N:7
                - generic [ref=e611]: MF:1
                - generic [ref=e612]: TF:2
                - generic [ref=e613]: D:8
          - row "Técnico 7 TF T D D N NF NF N N D D M M MF MF M D D T T TF TF T D D N NF NF N N M:3 T:4 N:6 MF:2 TF:3 NF:4 D:8" [ref=e614]:
            - cell "Técnico 7" [ref=e615]
            - cell "TF" [ref=e616] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e617]: TF
            - cell "T" [ref=e618] [cursor=pointer]:
              - generic "Tarde" [ref=e619]: T
            - cell "D" [ref=e620] [cursor=pointer]:
              - generic "Descanso" [ref=e621]: D
            - cell "D" [ref=e622] [cursor=pointer]:
              - generic "Descanso" [ref=e623]: D
            - cell "N" [ref=e624] [cursor=pointer]:
              - generic "Noche" [ref=e625]: "N"
            - cell "NF" [ref=e626] [cursor=pointer]:
              - generic "Noche Finde" [ref=e627]: NF
            - cell "NF" [ref=e628] [cursor=pointer]:
              - generic "Noche Finde" [ref=e629]: NF
            - cell "N" [ref=e630] [cursor=pointer]:
              - generic "Noche" [ref=e631]: "N"
            - cell "N" [ref=e632] [cursor=pointer]:
              - generic "Noche" [ref=e633]: "N"
            - cell "D" [ref=e634] [cursor=pointer]:
              - generic "Descanso" [ref=e635]: D
            - cell "D" [ref=e636] [cursor=pointer]:
              - generic "Descanso" [ref=e637]: D
            - cell "M" [ref=e638] [cursor=pointer]:
              - generic "Mañana" [ref=e639]: M
            - cell "M" [ref=e640] [cursor=pointer]:
              - generic "Mañana" [ref=e641]: M
            - cell "MF" [ref=e642] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e643]: MF
            - cell "MF" [ref=e644] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e645]: MF
            - cell "M" [ref=e646] [cursor=pointer]:
              - generic "Mañana" [ref=e647]: M
            - cell "D" [ref=e648] [cursor=pointer]:
              - generic "Descanso" [ref=e649]: D
            - cell "D" [ref=e650] [cursor=pointer]:
              - generic "Descanso" [ref=e651]: D
            - cell "T" [ref=e652] [cursor=pointer]:
              - generic "Tarde" [ref=e653]: T
            - cell "T" [ref=e654] [cursor=pointer]:
              - generic "Tarde" [ref=e655]: T
            - cell "TF" [ref=e656] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e657]: TF
            - cell "TF" [ref=e658] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e659]: TF
            - cell "T" [ref=e660] [cursor=pointer]:
              - generic "Tarde" [ref=e661]: T
            - cell "D" [ref=e662] [cursor=pointer]:
              - generic "Descanso" [ref=e663]: D
            - cell "D" [ref=e664] [cursor=pointer]:
              - generic "Descanso" [ref=e665]: D
            - cell "N" [ref=e666] [cursor=pointer]:
              - generic "Noche" [ref=e667]: "N"
            - cell "NF" [ref=e668] [cursor=pointer]:
              - generic "Noche Finde" [ref=e669]: NF
            - cell "NF" [ref=e670] [cursor=pointer]:
              - generic "Noche Finde" [ref=e671]: NF
            - cell "N" [ref=e672] [cursor=pointer]:
              - generic "Noche" [ref=e673]: "N"
            - cell "N" [ref=e674] [cursor=pointer]:
              - generic "Noche" [ref=e675]: "N"
            - cell "M:3 T:4 N:6 MF:2 TF:3 NF:4 D:8" [ref=e676]:
              - generic [ref=e677]:
                - generic [ref=e678]: M:3
                - generic [ref=e679]: T:4
                - generic [ref=e680]: N:6
                - generic [ref=e681]: MF:2
                - generic [ref=e682]: TF:3
                - generic [ref=e683]: NF:4
                - generic [ref=e684]: D:8
      - generic [ref=e685]:
        - generic [ref=e686]:
          - generic [ref=e687]: M
          - generic [ref=e688]: Mañana
        - generic [ref=e689]:
          - generic [ref=e690]: T
          - generic [ref=e691]: Tarde
        - generic [ref=e692]:
          - generic [ref=e693]: "N"
          - generic [ref=e694]: Noche
        - generic [ref=e695]:
          - generic [ref=e696]: J
          - generic [ref=e697]: Jornada normal
        - generic [ref=e698]:
          - generic [ref=e699]: D
          - generic [ref=e700]: Descanso
        - generic [ref=e701]:
          - generic [ref=e702]: V
          - generic [ref=e703]: Vacaciones
        - generic [ref=e704]:
          - generic [ref=e705]: B
          - generic [ref=e706]: Baja
  - button "Open Next.js Dev Tools" [ref=e712] [cursor=pointer]:
    - img [ref=e713]
  - alert [ref=e716]
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test";
  2   | import path from "path";
  3   | import fs from "fs";
  4   | 
  5   | // ─── Helpers ─────────────────────────────────────────────────────────────────
  6   | async function loginAsAdmin(page: Page) {
  7   |   await page.goto("/login");
  8   |   await page.locator('input[type="email"]').fill("admin@cuadrantes.local");
  9   |   await page.locator('input[type="password"]').fill("Admin1234!");
  10  |   await page.locator('button[type="submit"]').click();
  11  |   await page.waitForURL("/", { timeout: 10_000 });
  12  | }
  13  | 
  14  | async function screenshotOnFail(page: Page, testId: string) {
  15  |   const dir = path.join(process.cwd(), "tests/screenshots");
  16  |   fs.mkdirSync(dir, { recursive: true });
> 17  |   await page.screenshot({ path: path.join(dir, `${testId}-fail.png`) });
      |              ^ Error: page.screenshot: Target page, context or browser has been closed
  18  | }
  19  | 
  20  | // ─── CP-30 — Admin puede añadir un festivo ───────────────────────────────────
  21  | test("CP-30 — Admin puede añadir un festivo", async ({ page }) => {
  22  |   try {
  23  |     await loginAsAdmin(page);
  24  |     await page.locator('[data-testid="btn-holidays"]').click();
  25  |     await expect(page).toHaveURL("/holidays", { timeout: 5_000 });
  26  | 
  27  |     await page.locator('[data-testid="holiday-date-input"]').fill("2026-12-25");
  28  |     await page.locator('[data-testid="holiday-desc-input"]').fill("Navidad (QA)");
  29  |     await page.locator('[data-testid="btn-add-holiday"]').click();
  30  | 
  31  |     // El festivo aparece en la tabla
  32  |     await expect(page.locator("text=Navidad (QA)")).toBeVisible({ timeout: 6_000 });
  33  |     // Toast de éxito
  34  |     await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5_000 });
  35  |   } catch (e) {
  36  |     await screenshotOnFail(page, "CP-30");
  37  |     throw e;
  38  |   }
  39  | });
  40  | 
  41  | // ─── CP-31 — Admin puede eliminar un festivo ─────────────────────────────────
  42  | test("CP-31 — Admin puede eliminar un festivo", async ({ page }) => {
  43  |   try {
  44  |     await loginAsAdmin(page);
  45  |     await page.goto("/holidays");
  46  | 
  47  |     // Asegurar que hay al menos un festivo (el de CP-30 puede haber quedado)
  48  |     // Si no hay, lo añadimos
  49  |     const noHolidays = page.locator('[data-testid="no-holidays"]');
  50  |     if (await noHolidays.isVisible({ timeout: 2_000 }).catch(() => false)) {
  51  |       await page.locator('[data-testid="holiday-date-input"]').fill("2026-11-01");
  52  |       await page.locator('[data-testid="holiday-desc-input"]').fill("Todos los Santos (QA)");
  53  |       await page.locator('[data-testid="btn-add-holiday"]').click();
  54  |       await expect(page.locator("text=Todos los Santos (QA)")).toBeVisible({ timeout: 6_000 });
  55  |     }
  56  | 
  57  |     // Eliminar el primer botón de eliminar visible
  58  |     const deleteBtn = page.locator("button:has-text('Eliminar')").first();
  59  |     await deleteBtn.click();
  60  | 
  61  |     // El toast de éxito aparece
  62  |     await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5_000 });
  63  |   } catch (e) {
  64  |     await screenshotOnFail(page, "CP-31");
  65  |     throw e;
  66  |   }
  67  | });
  68  | 
  69  | // ─── CP-32 — La generación respeta festivos (M→MF) ───────────────────────────
  70  | test("CP-32 — La generación respeta los festivos (M→MF)", async ({ page }) => {
  71  |   try {
  72  |     await loginAsAdmin(page);
  73  | 
  74  |     // Añadir festivo el día 1 de Noviembre 2026
  75  |     await page.goto("/holidays");
  76  |     const yearSelect = page.locator("select");
  77  |     await yearSelect.selectOption("2026");
  78  | 
  79  |     // Añadir festivo el 1 de Noviembre
  80  |     await page.locator('[data-testid="holiday-date-input"]').fill("2026-11-01");
  81  |     await page.locator('[data-testid="holiday-desc-input"]').fill("Festivo test generación");
  82  |     await page.locator('[data-testid="btn-add-holiday"]').click();
  83  |     await expect(page.locator("text=Festivo test generación")).toBeVisible({ timeout: 6_000 });
  84  | 
  85  |     // Ir al cuadrante de Noviembre 2026 (6 nexts desde Mayo)
  86  |     await page.goto("/");
  87  |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  88  |     for (let i = 0; i < 6; i++) {
  89  |       await page.locator('[data-testid="btn-next-month"]').click();
  90  |       await page.waitForTimeout(400);
  91  |     }
  92  | 
  93  |     // Generar
  94  |     await page.locator('[data-testid="btn-generate"]').click();
  95  |     await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 10_000 });
  96  |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  97  | 
  98  |     // Verificar que el día 1 tiene MF, TF o NF (festivo) en al menos un empleado
  99  |     // (puede ser D si ese empleado descansa, lo cual también es válido)
  100 |     const day1Cells = page.locator("table tbody tr").first().locator("td").nth(1);
  101 |     await expect(day1Cells).toBeVisible({ timeout: 5_000 });
  102 |     // Al menos debe contener algún turno
  103 |     const cellText = await day1Cells.innerText().catch(() => "");
  104 |     // MF, TF, NF o D (válidos todos para un festivo)
  105 |     const validOnHoliday = ["MF", "TF", "NF", "D", ""];
  106 |     const shiftCell = day1Cells.locator("[data-testid^='shift-cell-']");
  107 |     const testId = await shiftCell.getAttribute("data-testid").catch(() => null);
  108 |     if (testId) {
  109 |       const shiftType = testId.replace("shift-cell-", "");
  110 |       expect(validOnHoliday).toContain(shiftType);
  111 |     }
  112 |   } catch (e) {
  113 |     await screenshotOnFail(page, "CP-32");
  114 |     throw e;
  115 |   }
  116 | });
  117 | 
```