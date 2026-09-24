# Design system — à adapter au projet

## Intention

L’interface doit paraître conçue par une équipe produit : hiérarchie nette, espace utile, composants cohérents et images choisies pour leur fonction. Elle doit éviter les signes d’interface générée automatiquement.

## Règles

Chaque écran possède une action principale. Les titres sont courts et hiérarchisés. Une section ne doit pas exister uniquement pour remplir la page. Une icône doit expliquer une action ou une information ; sinon elle est supprimée.

Définis ici les tokens réels du projet : couleurs, typographies, espacements, rayons, ombres, largeurs de contenu et points de rupture. L’agent doit réutiliser ces tokens et ne pas introduire de valeur arbitraire sans justification.

## Images

Chaque image doit avoir une source stable, un cadrage adapté, un texte alternatif et un rôle identifié. Ne réutilise pas la même image dans plusieurs zones importantes si cela donne une impression de remplissage. Vérifie le contraste lorsque du texte est posé sur une image.

## Responsive

Conçois d’abord pour le contenu et les gestes réels. À 320–390 px, aucune action principale ne doit sortir de l’écran. Le menu mobile doit avoir une fermeture claire. Les tableaux, cartes et formulaires doivent rester utilisables sans zoom.

## Motion

Les interactions courtes utilisent une transition de 150–280 ms. Les animations respectent `prefers-reduced-motion`. N’anime pas la mise en page avec des changements brusques de largeur, hauteur, marge ou position si une transition d’opacité ou de transformation suffit.
