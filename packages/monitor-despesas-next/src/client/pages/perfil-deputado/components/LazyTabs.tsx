
import { lazy } from 'react';

export const VisaoGeralTab = lazy(() => 
  import('../tabs/VisaoGeralTab.js').then(module => ({ default: module.VisaoGeralTab }))
);

export const PremiacoesTab = lazy(() => 
  import('../tabs/PremiacoesTab.js').then(module => ({ default: module.PremiacoesTab }))
);

export const TransacoesTab = lazy(() => 
  import('../tabs/TransacoesTab.js').then(module => ({ default: module.TransacoesTab }))
);

export const InsigniasTab = lazy(() => 
  import('../tabs/InsigniasTab.js').then(module => ({ default: module.InsigniasTab }))
);

export const RankingTab = lazy(() => 
  import('../tabs/RankingTab.js').then(module => ({ default: module.RankingTab }))
);

export const FornecedoresTab = lazy(() => 
  import('../tabs/FornecedoresTab.js').then(module => ({ default: module.FornecedoresTab }))
);

export const EvolucaoTab = lazy(() => 
  import('../tabs/EvolucaoTab.js').then(module => ({ default: module.EvolucaoTab }))
);

export const ComparativoTab = lazy(() => 
  import('../tabs/ComparativoTab.js').then(module => ({ default: module.ComparativoTab }))
);

export const RelacoesTab = lazy(() => 
  import('../tabs/RelacoesTab.js').then(module => ({ default: module.RelacoesTab }))
);