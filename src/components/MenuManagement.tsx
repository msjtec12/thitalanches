import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { Product, ProductExtra, Category } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Trash2, Plus, Image as ImageIcon, X, UtensilsCrossed, Check, ChevronDown } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState<string>(category.photoUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Preview local imediato
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
      photoUrl: finalPhotoUrl 
    });
    setSelectedFile(null);
    setIsEditing(false);
    setIsUploading(false);
  };

  const currentPhoto = previewUrl || category.photoUrl;

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
      {/* Linha principal */}
      <div className="flex items-center gap-2 p-2">
        {/* Thumbnail atual */}
        <div
          className="w-10 h-10 rounded-md flex-shrink-0 bg-muted overflow-hidden border border-border/40 flex items-center justify-center"
          style={currentPhoto ? { backgroundImage: `url(${currentPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!currentPhoto && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-background">#{category.order}</Badge>
          <span className="text-sm font-medium truncate">{category.name}</span>
        </div>

        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={() => setIsEditing(v => !v)}
        >
          {isEditing ? <ChevronDown className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Painel de edição expansível */}
      {isEditing && (
        <div className="border-t border-border/40 p-3 space-y-3 bg-background/60">
          <div className="grid grid-cols-4 gap-3">
             {/* Ordem */}
            <div className="space-y-1 col-span-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Posição</Label>
              <Input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="h-8" />
            </div>

            {/* Nome */}
            <div className="space-y-1 col-span-3">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-8" />
            </div>
          </div>

          {/* Upload de imagem */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Foto da categoria</Label>
            
            {/* Preview */}
            {currentPhoto && (
              <img
                src={currentPhoto}
                alt="preview"
                className="w-full h-24 object-cover rounded-lg border border-border/40"
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
              />
            )}

            {/* Botão de seleção */}
            <label className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-colors text-sm text-muted-foreground hover:text-primary">
              <ImageIcon className="w-4 h-4" />
              <span>{selectedFile ? selectedFile.name : 'Selecionar imagem...'}</span>
              <input
                ref={el => { if (el) fileInputRef[1](el); }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {selectedFile && (
              <p className="text-[10px] text-muted-foreground">✓ Imagem selecionada — será enviada ao salvar</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setSelectedFile(null); setPreviewUrl(category.photoUrl || ''); setOrder(category.order); }}>Cancelar</Button>
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
    setEditingProduct({ ...product, extras: product.extras ? [...product.extras] : [] });
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
      extras: [],
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

  const handleAddExtra = () => {
    if (editingProduct) {
      const newExtra: ProductExtra = {
        id: `extra-${Date.now()}`,
        name: '',
        price: 0,
        isActive: true
      };
      setEditingProduct({
        ...editingProduct,
        extras: [...(editingProduct.extras || []), newExtra]
      });
    }
  };

  const handleRemoveExtra = (id: string) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        extras: (editingProduct.extras || []).filter(e => e.id !== id)
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory({
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      order: categories.length + 1
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
            {products.slice().sort((a,b) => {
              if (a.categoryId !== b.categoryId) {
                const catA = categories.findIndex(c => c.id === a.categoryId);
                const catB = categories.findIndex(c => c.id === b.categoryId);
                return catA - catB;
              }
              return (a.sortOrder || 0) - (b.sortOrder || 0);
            }).map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-[10px] text-muted-foreground">#{product.sortOrder}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {categories.find(c => c.id === product.categoryId)?.name}
                </TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>
                  <Switch 
                    checked={product.isActive} 
                    onCheckedChange={(checked) => updateProduct({ ...product, isActive: checked })}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
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

                  {/* Extras / Adicionais */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Adicionais / Opcionais</Label>
                      <Button variant="outline" size="sm" onClick={handleAddExtra} className="gap-1">
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(editingProduct.extras || []).map((extra) => (
                        <div key={extra.id} className="flex gap-2 items-start bg-secondary/30 p-3 rounded-lg border border-border/50">
                          <div className="space-y-2 flex-1">
                            <Input 
                              placeholder="Nome" 
                              value={extra.name} 
                              onChange={(e) => {
                                const newExtras = (editingProduct.extras || []).map(ex => ex.id === extra.id ? {...ex, name: e.target.value} : ex);
                                setEditingProduct({...editingProduct, extras: newExtras});
                              }}
                              className="h-8 text-sm"
                            />
                            <Input 
                              placeholder="Preço" 
                              type="number" 
                              value={extra.price} 
                              onChange={(e) => {
                                const newExtras = (editingProduct.extras || []).map(ex => ex.id === extra.id ? {...ex, price: Number(e.target.value)} : ex);
                                setEditingProduct({...editingProduct, extras: newExtras});
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveExtra(extra.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Adicionar nova */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>Adicionar</Button>
            </div>

            {/* Lista de categorias com edição */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {categories.slice().sort((a,b) => a.order - b.order).map((category) => (
                <div key={category.id} className="relative">
                  <span className="absolute -left-6 top-3 text-[10px] font-bold text-muted-foreground/50">
                    {category.order.toString().padStart(2, '0')}
                  </span>
                  <CategoryEditRow
                    category={category}
                    onUpdate={updateCategory}
                    onDelete={deleteCategory}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
