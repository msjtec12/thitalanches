import { useState, Fragment } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Product, ExtraGroup, ExtraItem, Category } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Trash2, Plus, Image as ImageIcon, X, UtensilsCrossed, Check, ChevronDown, ChevronRight, Grid2X2, Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatPrice } from '@/utils/format';
import { db } from '@/lib/db';

// Componente inline de edição de categoria
function CategoryEditRow({
  category, onUpdate, onDelete
}: {
  category: Category;
  onUpdate: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [order, setOrder] = useState(category.order);
  const [isActive, setIsActive] = useState(category.isActive ?? true);
  const [previewUrl, setPreviewUrl] = useState<string>(category.photoUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>(category.extraGroups || []);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    setIsUploading(true);
    let finalPhotoUrl = category.photoUrl;

    if (selectedFile) {
      const uploaded = await db.uploadCategoryImage(selectedFile);
      if (uploaded) finalPhotoUrl = uploaded;
    }

    onUpdate({ 
      ...category, 
      name: name.trim() || category.name, 
      order: Number(order) || category.order,
      isActive: isActive,
      photoUrl: finalPhotoUrl,
      extraGroups: extraGroups
    });
    setSelectedFile(null);
    setIsEditing(false);
    setIsUploading(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(category.photoUrl || '');
    setOrder(category.order);
    setIsActive(category.isActive ?? true);
    setExtraGroups(category.extraGroups || []);
    setExpandedGroupId(null);
  };

  const addGroup = () => {
    const newGroup: ExtraGroup = {
      id: `grp-${Date.now()}`,
      name: '',
      minQty: 0,
      maxQty: 0,
      isRequired: false,
      isActive: true,
      sortOrder: extraGroups.length,
      items: []
    };
    setExtraGroups(prev => [...prev, newGroup]);
    setExpandedGroupId(newGroup.id);
  };

  const updateGroup = (groupId: string, updates: Partial<ExtraGroup>) => {
    setExtraGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const removeGroup = (groupId: string) => {
    setExtraGroups(prev => prev.filter(g => g.id !== groupId));
    if (expandedGroupId === groupId) setExpandedGroupId(null);
  };

  const addItemToGroup = (groupId: string) => {
    const group = extraGroups.find(g => g.id === groupId);
    const newItem: ExtraItem = {
      id: `item-${Date.now()}`,
      name: '',
      price: 0,
      isActive: true,
      sortOrder: group?.items.length || 0
    };
    updateGroup(groupId, { items: [...(group?.items || []), newItem] });
  };

  const updateItemInGroup = (groupId: string, itemId: string, updates: Partial<ExtraItem>) => {
    const group = extraGroups.find(g => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      items: group.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
    });
  };

  const removeItemFromGroup = (groupId: string, itemId: string) => {
    const group = extraGroups.find(g => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, { items: group.items.filter(i => i.id !== itemId) });
  };

  const currentPhoto = previewUrl || category.photoUrl;
  const totalExtrasCount = extraGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
      {/* Linha principal */}
      <div className="flex items-center gap-2 p-2">
        <div
          className="w-10 h-10 rounded-md flex-shrink-0 bg-muted overflow-hidden border border-border/40 flex items-center justify-center"
          style={currentPhoto ? { backgroundImage: `url(${currentPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!currentPhoto && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-background">#{category.order}</Badge>
          <span className={`text-sm font-medium truncate ${!category.isActive ? 'text-muted-foreground line-through opacity-50' : ''}`}>
            {category.name}
          </span>
          {!category.isActive && (
            <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-destructive/10 text-destructive border-destructive/20 uppercase font-black">Bloqueada</Badge>
          )}
          {totalExtrasCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-primary/10 text-primary border-primary/20">
              {extraGroups.length} grupo{extraGroups.length > 1 ? 's' : ''} · {totalExtrasCount} itens
            </Badge>
          )}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(v => !v)}>
          {isEditing ? <ChevronDown className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(category.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Painel de edição expansível */}
      {isEditing && (
        <div className="border-t border-border/40 p-3 space-y-3 bg-background/60">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1 col-span-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Posição</Label>
              <Input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="h-8" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1 col-span-1 flex flex-col items-center justify-end pb-1">
              <Label className="text-[8px] uppercase tracking-tight text-muted-foreground mb-1">Status</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Upload de imagem */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Foto da categoria</Label>
            {currentPhoto && (
              <img src={currentPhoto} alt="preview" className="w-full h-24 object-cover rounded-lg border border-border/40"
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            )}
            <label className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-colors text-sm text-muted-foreground hover:text-primary">
              <ImageIcon className="w-4 h-4" />
              <span>{selectedFile ? selectedFile.name : 'Selecionar imagem...'}</span>
              <input ref={el => { if (el) fileInputRef[1](el); }} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {selectedFile && <p className="text-[10px] text-muted-foreground">✓ Imagem selecionada — será enviada ao salvar</p>}
          </div>

          {/* ── GRUPOS DE COMPLEMENTOS (estilo iFood) ── */}
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Grupos de Complementos</Label>
              </div>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px]" onClick={addGroup}>
                <Plus className="w-3 h-3" />
                Novo Grupo
              </Button>
            </div>

            {extraGroups.length === 0 && (
              <div className="text-center py-4 bg-secondary/20 rounded-lg border border-dashed border-border/50">
                <Layers className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground/60 italic">Nenhum grupo de complementos.</p>
                <p className="text-[9px] text-muted-foreground/40">Crie grupos como "Adicionais", "Escolha o molho", etc.</p>
              </div>
            )}

            <div className="space-y-2">
              {extraGroups.map((group, gi) => {
                const isExpanded = expandedGroupId === group.id;
                return (
                  <div key={group.id} className="rounded-lg border border-border/60 bg-card overflow-hidden">
                    {/* Cabeçalho do grupo */}
                    <div 
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-secondary/30 transition-colors"
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold truncate block">{group.name || '(Sem nome)'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {group.isRequired && (
                            <Badge className="h-3.5 px-1 text-[7px] bg-red-500/10 text-red-500 border-red-500/20 font-black">OBRIGATÓRIO</Badge>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            {group.minQty > 0 ? `Min: ${group.minQty}` : 'Opcional'}
                            {group.maxQty > 0 ? ` · Max: ${group.maxQty}` : ''}
                            {' · '}{group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                      </div>
                      <Switch 
                        checked={group.isActive} 
                        onCheckedChange={(v) => { updateGroup(group.id, { isActive: v }); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Conteúdo expandido do grupo */}
                    {isExpanded && (
                      <div className="border-t border-border/40 p-3 space-y-3 bg-secondary/5">
                        {/* Config do grupo */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">Nome do Grupo</Label>
                            <Input value={group.name} onChange={e => updateGroup(group.id, { name: e.target.value })} 
                              placeholder="Ex: Adicionais, Escolha o molho..." className="h-7 text-xs" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">Mínimo</Label>
                            <Input type="number" min={0} value={group.minQty} onChange={e => {
                              const val = Number(e.target.value) || 0;
                              updateGroup(group.id, { minQty: val, isRequired: val > 0 });
                            }} className="h-7 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase tracking-wide text-muted-foreground">Máximo</Label>
                            <Input type="number" min={0} value={group.maxQty} onChange={e => updateGroup(group.id, { maxQty: Number(e.target.value) || 0 })}
                              className="h-7 text-xs" />
                          </div>
                          <div className="flex flex-col items-center justify-end pb-0.5 space-y-1">
                            <Label className="text-[8px] uppercase tracking-tight text-muted-foreground">Obrigatório</Label>
                            <Switch checked={group.isRequired} onCheckedChange={v => updateGroup(group.id, { isRequired: v, minQty: v && group.minQty === 0 ? 1 : group.minQty })} />
                          </div>
                        </div>

                        {/* Itens do grupo */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Itens</Label>
                            <Button variant="outline" size="sm" className="h-6 gap-1 text-[9px] px-2" onClick={() => addItemToGroup(group.id)}>
                              <Plus className="w-2.5 h-2.5" />
                              Item
                            </Button>
                          </div>
                          
                          {group.items.length === 0 && (
                            <p className="text-[9px] text-muted-foreground/50 italic text-center py-2">Adicione itens a este grupo</p>
                          )}

                          {group.items.map((item) => (
                            <div key={item.id} className="flex gap-1.5 items-center bg-background p-1.5 rounded-md border border-border/50">
                              <Input placeholder="Nome" value={item.name} onChange={e => updateItemInGroup(group.id, item.id, { name: e.target.value })} className="h-6 text-[11px] flex-1" />
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">R$</span>
                                <Input type="number" placeholder="0" value={item.price} onChange={e => updateItemInGroup(group.id, item.id, { price: Number(e.target.value) })} className="h-6 text-[11px] w-20 pl-6" />
                              </div>
                              <Switch checked={item.isActive} onCheckedChange={v => updateItemInGroup(group.id, item.id, { isActive: v })} />
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItemFromGroup(group.id, item.id)}>
                                <X className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancelar</Button>
            <Button size="sm" className="gap-1" onClick={handleSave} disabled={isUploading}>
              {isUploading ? <><span className="animate-spin">⏳</span> Enviando...</> : <><Check className="w-3 h-3" /> Salvar</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


export function MenuManagement() {
  const { products, categories, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } = useOrders();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');


  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsSheetOpen(true);
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      costPrice: 0,
      isActive: true,
      categoryId: categories[0]?.id || '',
      sortOrder: products.length + 1
    };
    setEditingProduct(newProduct);
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      updateProduct(editingProduct);
      setIsSheetOpen(false);
      setEditingProduct(null);
    }
  };



  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory({
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      order: categories.length + 1,
      isActive: true
    });
    setNewCategoryName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold">Gestão de Cardápio</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)} className="gap-2 flex-1 sm:flex-none">
            Categorias
          </Button>
          <Button onClick={handleAddProduct} className="gap-2 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.slice().sort((a,b) => a.order - b.order).map((category) => {
              const categoryProducts = products
                .filter(p => p.categoryId === category.id)
                .sort((a,b) => {
                  const orderA = Number(a.sortOrder) || 0;
                  const orderB = Number(b.sortOrder) || 0;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.name.localeCompare(b.name);
                });

              if (categoryProducts.length === 0) return null;

              return (
                <Fragment key={category.id}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-y-2 border-border/10">
                    <TableCell colSpan={6} className="py-2 px-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-white shadow-sm shadow-primary/20 shrink-0">
                          {category.order.toString().padStart(2, '0')}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tighter text-zinc-600 dark:text-zinc-400">
                          {category.name} <span className="text-muted-foreground/60 font-medium ml-1">({categoryProducts.length} itens)</span>
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {categoryProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-secondary/5 transition-colors">
                      <TableCell className="font-mono text-[10px] text-muted-foreground/60 italic border-l-2 border-transparent">
                        #{product.sortOrder.toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-bold text-sm uppercase tracking-tight py-4">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground italic font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={product.isActive} 
                          onCheckedChange={(checked) => updateProduct({ ...product, isActive: checked })}
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md w-full p-0">
          {editingProduct && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pt-8 border-b border-border bg-secondary/10 relative">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-xl font-bold tracking-tight">{editingProduct.name ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
                    <SheetDescription className="text-xs">Configure os detalhes do seu item.</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1 flex flex-col gap-1.5">
                        <Label htmlFor="sortOrder" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Posição</Label>
                        <Input 
                          id="sortOrder" 
                          type="number"
                          value={editingProduct.sortOrder} 
                          onChange={(e) => setEditingProduct({...editingProduct, sortOrder: Number(e.target.value)})}
                          className="bg-secondary/20 border-border/50 focus:border-primary/50 transition-all font-bold"
                        />
                      </div>
                      <div className="col-span-3 flex flex-col gap-1.5">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nome do Produto</Label>
                        <Input 
                          id="name" 
                          placeholder="Ex: X-Salada Especial"
                          value={editingProduct.name} 
                          onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                          className="bg-secondary/20 border-border/50 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Categoria</Label>
                      <Select 
                        value={editingProduct.categoryId} 
                        onValueChange={(val) => setEditingProduct({...editingProduct, categoryId: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Descrição</Label>
                      <Textarea 
                        id="desc" 
                        placeholder="Descreva os ingredientes e detalhes do lanche..."
                        value={editingProduct.description} 
                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                        rows={3}
                        className="bg-secondary/20 border-border/50 focus:border-primary/50 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cost" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Preço de Custo</Label>
                      <Input 
                        id="cost" 
                        type="number" 
                        value={editingProduct.costPrice} 
                        onChange={(e) => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})}
                        className="bg-background border-border/50 h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-wider text-primary ml-1">Preço de Venda</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        value={editingProduct.price} 
                        onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        className="bg-background border-primary/20 h-9 font-bold"
                      />
                    </div>
                  </div>

                  {/* Combo Management */}
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-primary">Combo / Oferta</Label>
                        <p className="text-[10px] text-muted-foreground">O produto inclui outros itens do cardápio.</p>
                      </div>
                      <Switch 
                        checked={editingProduct.isCombo} 
                        onCheckedChange={(val) => setEditingProduct({...editingProduct, isCombo: val})}
                      />
                    </div>

                    {editingProduct.isCombo && (
                      <div className="space-y-2">
                         <Label className="text-[10px] font-bold uppercase text-muted-foreground">Itens Inclusos</Label>
                         <div className="flex flex-wrap gap-2">
                           {products.filter(p => !p.isCombo && p.id !== editingProduct.id).map(p => {
                             const isSelected = editingProduct.comboItems?.includes(p.id);
                             return (
                               <Badge 
                                 key={p.id}
                                 variant={isSelected ? 'default' : 'outline'}
                                 className="cursor-pointer"
                                 onClick={() => {
                                   const current = editingProduct.comboItems || [];
                                   const next = isSelected 
                                     ? current.filter(id => id !== p.id)
                                     : [...current, p.id];
                                   setEditingProduct({...editingProduct, comboItems: next});
                                 }}
                               >
                                 {p.name}
                               </Badge>
                             );
                           })}
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Image Placeholder */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Imagem do Produto</Label>
                    <div className="group relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all cursor-pointer bg-secondary/5">
                      <div className="bg-secondary p-3 rounded-full group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium">Clique para fazer upload</span>
                      <span className="text-[10px] text-muted-foreground/60">Tamanho sugerido: 800x800px</span>
                    </div>
                  </div>

                </div>
              </ScrollArea>

              <SheetFooter className="p-6 border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0">
                <div className="flex gap-3 w-full">
                  <Button variant="ghost" onClick={() => setIsSheetOpen(false)} className="flex-1">Cancelar</Button>
                  <Button onClick={handleSave} className="flex-1 shadow-lg shadow-primary/20">Salvar Alterações</Button>
                </div>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Grid2X2 className="w-4 h-4 text-primary" />
              </div>
              Gerenciar Categorias
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 space-y-6">
              {/* Adicionar nova */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nova Categoria</Label>
                <div className="flex gap-2 p-1.5 bg-secondary/20 rounded-xl border border-border/50 focus-within:border-primary/50 transition-all">
                  <Input
                    placeholder="Ex: Bebidas, Sobremesas..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none h-10 font-medium"
                  />
                  <Button onClick={handleAddCategory} className="shadow-lg shadow-primary/20 px-6 font-bold uppercase text-xs tracking-wider">
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Categorias Existentes</Label>
                  <span className="text-[10px] text-muted-foreground italic">{categories.length} cadastradas</span>
                </div>
                
                <ScrollArea className="h-[400px] pr-4 -mr-4">
                  <div className="space-y-3 pb-4">
                    {categories.slice().sort((a,b) => a.order - b.order).map((category) => (
                      <CategoryEditRow
                        key={category.id}
                        category={category}
                        onUpdate={updateCategory}
                        onDelete={deleteCategory}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
