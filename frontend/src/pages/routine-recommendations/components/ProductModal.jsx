import React from "react";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";

const ProductModal = ({ isOpen, onClose, category, products, isLoading }) => {
  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })?.format(price);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center">
        <div className="glass-card w-full max-w-6xl max-h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Icon name="Package" size={20} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Gợi ý sản phẩm: {category?.category}
                </h2>
                <p className="text-sm text-muted-foreground font-caption">
                  {category?.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              iconName="X"
              iconSize={20}
              className="p-2"
            />
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5]?.map((i) => (
                  <div key={i} className="glass-card p-4 animate-pulse">
                    <div className="aspect-square bg-white/20 rounded-lg mb-4"></div>
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((product) => (
                  <div
                    key={product?.id}
                    className="glass-card p-4 hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-white/10">
                      <Image
                        src={product?.image}
                        alt={product?.imageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-foreground line-clamp-2">
                          {product?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-caption">
                          {product?.brand}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary">
                          {formatPrice(product?.price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Icon
                            name="Star"
                            size={14}
                            className="text-amber-500 fill-current"
                          />
                          <span className="text-sm text-muted-foreground">
                            {product?.rating}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">
                          Lợi ích chính:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {product?.benefits
                            ?.slice(0, 3)
                            ?.map((benefit, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gradient-primary/20 text-primary rounded-full"
                              >
                                {benefit}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/20">
                        <Button
                          variant="outline"
                          className="w-full"
                          iconName="ExternalLink"
                          iconPosition="right"
                          iconSize={14}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20 bg-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-muted-foreground font-caption">
                <p>
                  💡 <strong>Mẹo:</strong> Hãy đọc thành phần và đánh giá trước
                  khi mua
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  iconSize={16}
                >
                  Quay lại
                </Button>
                <Button
                  variant="default"
                  iconName="MessageCircle"
                  iconPosition="left"
                  iconSize={16}
                  onClick={() => {
                    onClose();
                    window.location.href = "/skincare-chatbot";
                  }}
                >
                  Tư vấn thêm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
